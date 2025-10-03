"""
========================================
BRANDBLOOM INSIGHTS - METADATA SERVICE
========================================

Purpose: Metadata state persistence and management service layer

Description:
This service module handles all metadata operations for the BrandBloom Insights
application. It provides state persistence, retrieval, and management for
concatenation workflows, ensuring data continuity across user sessions.

Key Functionality:
- Concatenation state persistence to JSON files
- State retrieval and validation
- State deletion and cleanup
- Comprehensive error handling
- Type-safe state management
- Automatic directory creation

Dependencies:
- json for state serialization
- pathlib for file operations
- datetime for timestamp management
- app.core.config for settings

Used by:
- Route modules for state operations
- Concatenation workflows
- Data persistence requirements
- Session management

Last Updated: 2024-12-23
Author: BrandBloom Backend Team
"""

import json
import os
from pathlib import Path
from typing import Dict, Any, Optional
from datetime import datetime

from app.core.config import settings
from app.models.data_models import ConcatenationState

class MetadataService:
    """Service class for metadata operations"""
    
    @staticmethod
    def save_concatenation_state(state_data: Dict[str, Any], brand: str = None) -> Dict[str, Any]:
        """
        Save concatenation state to JSON file
        
        Args:
            state_data: Dictionary containing concatenation state
            
        Returns:
            Dict with save operation results
        """
        # Validate required fields
        required_fields = ["originalFileName", "concatenatedFileName"]
        for field in required_fields:
            if not state_data.get(field):
                raise ValueError(f"{field} is required")
        
        # Note: Legacy global METADATA_DIR creation removed  
        # Brand-specific directories should be created by brand analysis service
        # settings.METADATA_DIR.mkdir(parents=True, exist_ok=True)
        
        # Create state data with defaults
        complete_state = {
            "originalFileName": state_data["originalFileName"],
            "concatenatedFileName": state_data["concatenatedFileName"],
            "selectedSheets": state_data.get("selectedSheets", []),
            "targetVariable": state_data.get("targetVariable"),
            "selectedFilters": state_data.get("selectedFilters", []),
            "brandMetadata": state_data.get("brandMetadata"),
            "previewData": state_data.get("previewData"),
            "columnCategories": state_data.get("columnCategories"),
            "totalRows": state_data.get("totalRows", 0),
            "processedAt": state_data.get("processedAt") or datetime.now().isoformat(),
            "savedAt": datetime.now().isoformat(),
            "status": state_data.get("status", "completed")
        }
        
        # Extract brand if not provided
        if not brand:
            brand = MetadataService._extract_brand_from_filename(state_data["originalFileName"])
            if not brand:
                raise ValueError("Brand parameter is required and could not be extracted from filename - no legacy fallback supported")
        
        # Generate state filename - use concatenated filename as the key for state lookup
        state_filename = f"{state_data['concatenatedFileName'].replace('.xlsx', '')}_state.json"
        
        # Use brand-specific metadata directory
        brand_dirs = settings.get_brand_directories(brand)
        brand_dirs["metadata_dir"].mkdir(parents=True, exist_ok=True)
        state_filepath = brand_dirs["metadata_dir"] / state_filename
        
        # Save state to JSON file
        with open(state_filepath, 'w', encoding='utf-8') as f:
            json.dump(complete_state, f, indent=2, ensure_ascii=False)
        
        return {
            "success": True,
            "message": "Concatenation state saved successfully",
            "data": {
                "stateFileName": state_filename,
                "stateFilePath": str(state_filepath),
                "originalFileName": state_data["originalFileName"],
                "concatenatedFileName": state_data["concatenatedFileName"],
                "savedAt": complete_state["savedAt"]
            }
        }
    
    @staticmethod
    def get_concatenation_state(filename: str, brand: str = None) -> Dict[str, Any]:
        """
        Retrieve concatenation state for a file
        
        Args:
            filename: Name of file (can be original or concatenated filename)
            
        Returns:
            Dict with state data
        """
        # Extract brand if not provided
        if not brand:
            brand = MetadataService._extract_brand_from_filename(filename)
            if not brand:
                raise ValueError("Brand parameter is required and could not be extracted from filename")
        
        # Generate state filename - use the filename directly as the key
        state_filename = f"{filename.replace('.xlsx', '')}_state.json"
        
        # Use brand-specific metadata directory
        brand_dirs = settings.get_brand_directories(brand)
        state_filepath = brand_dirs["metadata_dir"] / state_filename
        
        if not state_filepath.exists():
            raise FileNotFoundError(f"No saved state found for this file: {filename}")
        
        # Load state data
        with open(state_filepath, 'r', encoding='utf-8') as f:
            state_data = json.load(f)
        
        # Validate state data
        MetadataService._validate_state_data(state_data)
        
        return {
            "success": True,
            "message": "State retrieved successfully",
            "data": state_data
        }
    
    @staticmethod
    def delete_concatenation_state(original_filename: str) -> Dict[str, Any]:
        """
        Delete concatenation state for a file
        
        Args:
            original_filename: Name of original file
            
        Returns:
            Dict with deletion results
        """
        # Generate state filename
        base_name = os.path.splitext(original_filename)[0]
        state_filename = f"{base_name}_state.json"
        state_filepath = settings.METADATA_DIR / state_filename
        
        if not state_filepath.exists():
            raise FileNotFoundError("No saved state found for this file")
        
        # Delete state file
        os.remove(state_filepath)
        
        return {
            "success": True,
            "message": "State deleted successfully",
            "data": {
                "originalFileName": original_filename,
                "stateFileName": state_filename,
                "deletedAt": datetime.now().isoformat()
            }
        }
    
    @staticmethod
    def list_all_states() -> Dict[str, Any]:
        """
        List all available concatenation states
        
        Returns:
            Dict with list of all states
        """
        if not settings.METADATA_DIR.exists():
            return {
                "success": True,
                "data": {
                    "states": [],
                    "total_count": 0
                }
            }
        
        states = []
        for state_file in settings.METADATA_DIR.glob("*_state.json"):
            try:
                with open(state_file, 'r', encoding='utf-8') as f:
                    state_data = json.load(f)
                
                # Extract key information
                state_info = {
                    "filename": state_file.name,
                    "originalFileName": state_data.get("originalFileName"),
                    "concatenatedFileName": state_data.get("concatenatedFileName"),
                    "savedAt": state_data.get("savedAt"),
                    "status": state_data.get("status", "unknown"),
                    "totalRows": state_data.get("totalRows", 0),
                    "selectedSheets": len(state_data.get("selectedSheets", []))
                }
                states.append(state_info)
            except Exception:
                # Skip corrupted state files
                continue
        
        # Sort by saved date (most recent first)
        states.sort(key=lambda x: x.get("savedAt", ""), reverse=True)
        
        return {
            "success": True,
            "data": {
                "states": states,
                "total_count": len(states)
            }
        }
    
    @staticmethod
    def update_concatenation_state(original_filename: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update specific fields in concatenation state
        
        Args:
            original_filename: Name of original file
            updates: Dictionary with fields to update
            
        Returns:
            Dict with update results
        """
        # Get existing state
        state_result = MetadataService.get_concatenation_state(original_filename)
        existing_state = state_result["data"]
        
        # Apply updates
        existing_state.update(updates)
        existing_state["savedAt"] = datetime.now().isoformat()
        
        # Save updated state
        return MetadataService.save_concatenation_state(existing_state)
    
    @staticmethod
    def cleanup_old_states(days_old: int = 30) -> Dict[str, Any]:
        """
        Clean up state files older than specified days
        
        Args:
            days_old: Number of days after which states are considered old
            
        Returns:
            Dict with cleanup results
        """
        if not settings.METADATA_DIR.exists():
            return {
                "success": True,
                "data": {
                    "deleted_count": 0,
                    "deleted_files": []
                }
            }
        
        cutoff_timestamp = datetime.now().timestamp() - (days_old * 24 * 3600)
        deleted_files = []
        
        for state_file in settings.METADATA_DIR.glob("*_state.json"):
            try:
                file_timestamp = state_file.stat().st_mtime
                if file_timestamp < cutoff_timestamp:
                    state_file.unlink()
                    deleted_files.append(state_file.name)
            except Exception:
                # Skip files that can't be processed
                continue
        
        return {
            "success": True,
            "data": {
                "deleted_count": len(deleted_files),
                "deleted_files": deleted_files,
                "cutoff_days": days_old
            }
        }
    
    @staticmethod
    def _validate_state_data(state_data: Dict[str, Any]) -> None:
        """
        Validate state data structure
        
        Args:
            state_data: State data to validate
            
        Raises:
            ValueError: If state data is invalid
        """
        required_fields = ["originalFileName", "concatenatedFileName"]
        
        for field in required_fields:
            if field not in state_data:
                raise ValueError(f"Missing required field: {field}")
        
        # Validate data types
        if not isinstance(state_data.get("selectedSheets", []), list):
            raise ValueError("selectedSheets must be a list")
        
        if not isinstance(state_data.get("selectedFilters", []), list):
            raise ValueError("selectedFilters must be a list")
        
        if not isinstance(state_data.get("totalRows", 0), (int, float)):
            raise ValueError("totalRows must be a number")
    
    @staticmethod
    def export_state_data(original_filename: str, export_format: str = "json") -> Path:
        """
        Export state data to specified format
        
        Args:
            original_filename: Name of original file
            export_format: Export format ('json', 'yaml')
            
        Returns:
            Path to exported file
        """
        # Get state data
        state_result = MetadataService.get_concatenation_state(original_filename)
        state_data = state_result["data"]
        
        # Generate export filename
        base_name = os.path.splitext(original_filename)[0]
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        export_filename = f"{base_name}_state_export_{timestamp}.{export_format}"
        export_path = settings.METADATA_DIR / export_filename
        
        # Export based on format
        if export_format.lower() == "json":
            with open(export_path, 'w', encoding='utf-8') as f:
                json.dump(state_data, f, indent=2, ensure_ascii=False)
        else:
            raise ValueError(f"Unsupported export format: {export_format}")
        
        return export_path
    
    @staticmethod
    def _extract_brand_from_filename(filename: str) -> Optional[str]:
        """
        Extract brand name from filename
        
        Args:
            filename: Original filename
            
        Returns:
            Brand name if found, None otherwise
        """
        try:
            # Remove file extension first
            base_name = filename.replace(".xlsx", "").replace(".csv", "")
            
            # Try multiple patterns to extract brand name
            patterns_to_try = [
                # Pattern 1: NIELSEN - Brand Name - Other Text...
                lambda f: f.split(" - ")[1].strip() if " - " in f and len(f.split(" - ")) >= 2 else None,
                
                # Pattern 2: BrandName_other_text (like X-Men_x-men_with_rpis)
                lambda f: f.split("_")[0] if "_" in f else None,
                
                # Pattern 3: BrandName-other-text
                lambda f: f.split("-")[0] if "-" in f else None,
                
                # Pattern 4: Just use the first part before any separator
                lambda f: re.split(r'[_\-\s]', f)[0] if re.search(r'[_\-\s]', f) else None
            ]
            
            import re
            
            for pattern_func in patterns_to_try:
                try:
                    brand_name = pattern_func(base_name)
                    if brand_name and len(brand_name) > 0:
                        # Clean up the brand name
                        brand_name = brand_name.strip()
                        # Remove timestamp patterns like _1234567890
                        brand_name = re.sub(r'_\d{10,}', '', brand_name)
                        # Remove any remaining special characters
                        brand_name = re.sub(r'[^\w\s-]', '', brand_name)
                        
                        if brand_name and len(brand_name) > 0:
                            print(f"✅ Extracted brand '{brand_name}' from filename '{filename}'")
                            return brand_name
                except Exception:
                    continue
            
            print(f"⚠️ Could not extract brand from filename '{filename}'")
            return None
            
        except Exception as e:
            print(f"❌ Error extracting brand from filename '{filename}': {e}")
            return None
