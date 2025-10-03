"""
========================================
PACK SIZE COVERAGE ANALYZER
========================================

Purpose: Analyze pack size coverage between main data and RPI columns

Description:
This module provides analysis capabilities for understanding how well RPI columns
cover the pack sizes present in the main data. It helps identify gaps in coverage,
excess RPI columns, and provides insights for pack size ordering decisions.

Key Functionality:
- Analyze RPI column coverage for main pack sizes
- Identify missing coverage areas
- Find excess or unused RPI columns
- Calculate coverage statistics and metrics
- Support user pack size ordering analysis

Business Logic:
- Coverage based on user pack size ordering (same, ±1 position)
- Identify main pack sizes without relevant RPI columns
- Track RPI columns that don't match any main pack sizes
- Provide recommendations for pack size ordering
- Generate detailed coverage reports for business users

Last Updated: 2025-01-27
Author: BrandBloom Backend Team
"""

from typing import Dict, List, Any


class PackSizeCoverageAnalyzer:
    """Analyzer for pack size coverage between main data and RPI columns"""
    
    @staticmethod
    def get_relevant_rpi_columns(
        main_pack_size: str, 
        rpi_columns_info: List[Dict[str, Any]],
        user_pack_size_order: List[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get RPI columns that are relevant for given main pack size using user's ordering
        
        Args:
            main_pack_size: Pack size from main data
            rpi_columns_info: List of RPI column information
            user_pack_size_order: User's ordered list of pack sizes
            
        Returns:
            List of relevant RPI column information
        """
        if not main_pack_size or not user_pack_size_order:
            # Without user ordering, return all for now (will be fixed with frontend)
            return rpi_columns_info
        
        try:
            main_position = user_pack_size_order.index(main_pack_size)
        except ValueError:
            return []  # Main pack size not found in user's ordering
        
        relevant_columns = []
        
        for rpi_info in rpi_columns_info:
            rpi_pack_size = rpi_info['pack_size']
            
            try:
                rpi_position = user_pack_size_order.index(rpi_pack_size)
            except ValueError:
                continue  # RPI pack size not in user's ordering
            
            # Allow same position, position-1, position+1 only
            if abs(main_position - rpi_position) <= 1:
                relevant_columns.append(rpi_info)
        
        return relevant_columns
    
    @staticmethod
    def analyze_pack_size_coverage(
        main_pack_sizes: List[str], 
        rpi_columns_info: List[Dict[str, Any]],
        user_pack_size_order: List[str] = None
    ) -> Dict[str, Any]:
        """
        Analyze how well RPI columns cover the main pack sizes using user's ordering
        
        Args:
            main_pack_sizes: List of pack sizes from main data
            rpi_columns_info: List of RPI column information
            user_pack_size_order: User's ordered list of pack sizes
            
        Returns:
            Dict with comprehensive coverage analysis
        """
        coverage_analysis = {
            'total_main_pack_sizes': len(main_pack_sizes),
            'total_rpi_columns': len(rpi_columns_info),
            'pack_size_coverage': {},
            'missing_coverage': [],
            'excess_rpi_columns': [],
            'needs_user_ordering': user_pack_size_order is None,
            'coverage_statistics': {},
            'recommendations': []
        }
        
        # Check coverage for each main pack size
        total_coverage_score = 0
        for main_size in main_pack_sizes:
            relevant_rpis = PackSizeCoverageAnalyzer.get_relevant_rpi_columns(
                main_size, rpi_columns_info, user_pack_size_order
            )
            
            coverage_analysis['pack_size_coverage'][main_size] = {
                'relevant_rpi_columns': len(relevant_rpis),
                'rpi_details': relevant_rpis,
                'has_coverage': len(relevant_rpis) > 0
            }
            
            if len(relevant_rpis) == 0:
                coverage_analysis['missing_coverage'].append(main_size)
            else:
                total_coverage_score += 1
        
        # Calculate coverage statistics
        coverage_analysis['coverage_statistics'] = PackSizeCoverageAnalyzer._calculate_coverage_stats(
            coverage_analysis, main_pack_sizes, rpi_columns_info
        )
        
        # Identify excess RPI columns
        coverage_analysis['excess_rpi_columns'] = PackSizeCoverageAnalyzer._find_excess_rpi_columns(
            main_pack_sizes, rpi_columns_info, user_pack_size_order
        )
        
        # Generate recommendations
        coverage_analysis['recommendations'] = PackSizeCoverageAnalyzer._generate_recommendations(
            coverage_analysis
        )
        
        return coverage_analysis
    
    @staticmethod
    def _calculate_coverage_stats(
        coverage_analysis: Dict[str, Any],
        main_pack_sizes: List[str],
        rpi_columns_info: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Calculate detailed coverage statistics"""
        total_main = len(main_pack_sizes)
        covered_main = total_main - len(coverage_analysis['missing_coverage'])
        
        coverage_percentage = (covered_main / total_main * 100) if total_main > 0 else 0
        
        # Calculate RPI column utilization
        used_rpi_columns = set()
        for pack_coverage in coverage_analysis['pack_size_coverage'].values():
            for rpi_detail in pack_coverage['rpi_details']:
                used_rpi_columns.add(rpi_detail['column_name'])
        
        rpi_utilization = (len(used_rpi_columns) / len(rpi_columns_info) * 100) if rpi_columns_info else 0
        
        return {
            'coverage_percentage': round(coverage_percentage, 1),
            'covered_pack_sizes': covered_main,
            'uncovered_pack_sizes': len(coverage_analysis['missing_coverage']),
            'rpi_utilization_percentage': round(rpi_utilization, 1),
            'used_rpi_columns': len(used_rpi_columns),
            'unused_rpi_columns': len(rpi_columns_info) - len(used_rpi_columns)
        }
    
    @staticmethod
    def _find_excess_rpi_columns(
        main_pack_sizes: List[str],
        rpi_columns_info: List[Dict[str, Any]],
        user_pack_size_order: List[str] = None
    ) -> List[Dict[str, Any]]:
        """Find RPI columns that don't match any main pack sizes"""
        if not user_pack_size_order:
            return []  # Can't determine excess without ordering
        
        # Get all RPI columns that are relevant for at least one main pack size
        relevant_rpi_columns = set()
        
        for main_size in main_pack_sizes:
            relevant_rpis = PackSizeCoverageAnalyzer.get_relevant_rpi_columns(
                main_size, rpi_columns_info, user_pack_size_order
            )
            for rpi_info in relevant_rpis:
                relevant_rpi_columns.add(rpi_info['column_name'])
        
        # Find RPI columns that are not relevant for any main pack size
        excess_columns = []
        for rpi_info in rpi_columns_info:
            if rpi_info['column_name'] not in relevant_rpi_columns:
                excess_columns.append(rpi_info)
        
        return excess_columns
    
    @staticmethod
    def _generate_recommendations(coverage_analysis: Dict[str, Any]) -> List[str]:
        """Generate recommendations based on coverage analysis"""
        recommendations = []
        
        stats = coverage_analysis['coverage_statistics']
        
        # Coverage recommendations
        if stats['coverage_percentage'] < 50:
            recommendations.append("Low pack size coverage detected. Consider adding more RPI columns or adjusting pack size ordering.")
        elif stats['coverage_percentage'] < 80:
            recommendations.append("Moderate pack size coverage. Review missing pack sizes for potential improvements.")
        else:
            recommendations.append("Good pack size coverage achieved.")
        
        # RPI utilization recommendations
        if stats['rpi_utilization_percentage'] < 50:
            recommendations.append("Many RPI columns are not being used. Consider reviewing pack size ordering or removing unused columns.")
        elif stats['rpi_utilization_percentage'] > 90:
            recommendations.append("Excellent RPI column utilization.")
        
        # Specific missing coverage
        if coverage_analysis['missing_coverage']:
            missing_sizes = ', '.join(coverage_analysis['missing_coverage'][:3])
            if len(coverage_analysis['missing_coverage']) > 3:
                missing_sizes += f" and {len(coverage_analysis['missing_coverage']) - 3} more"
            recommendations.append(f"Missing coverage for pack sizes: {missing_sizes}")
        
        # User ordering recommendation
        if coverage_analysis['needs_user_ordering']:
            recommendations.append("Set up user pack size ordering to enable intelligent RPI matching.")
        
        return recommendations
    
    @staticmethod
    def generate_coverage_report(coverage_analysis: Dict[str, Any]) -> str:
        """
        Generate a human-readable coverage report
        
        Args:
            coverage_analysis: Coverage analysis results
            
        Returns:
            Formatted coverage report string
        """
        stats = coverage_analysis['coverage_statistics']
        
        report = f"""
Pack Size Coverage Analysis Report
==================================

Overview:
- Total Main Pack Sizes: {coverage_analysis['total_main_pack_sizes']}
- Total RPI Columns: {coverage_analysis['total_rpi_columns']}
- Coverage: {stats['covered_pack_sizes']}/{coverage_analysis['total_main_pack_sizes']} ({stats['coverage_percentage']}%)
- RPI Utilization: {stats['used_rpi_columns']}/{coverage_analysis['total_rpi_columns']} ({stats['rpi_utilization_percentage']}%)

"""
        
        if coverage_analysis['missing_coverage']:
            report += f"Missing Coverage:\n"
            for pack_size in coverage_analysis['missing_coverage']:
                report += f"  - {pack_size}\n"
            report += "\n"
        
        if coverage_analysis['excess_rpi_columns']:
            report += f"Unused RPI Columns:\n"
            for rpi_info in coverage_analysis['excess_rpi_columns']:
                report += f"  - {rpi_info['column_name']} ({rpi_info['pack_size']})\n"
            report += "\n"
        
        if coverage_analysis['recommendations']:
            report += "Recommendations:\n"
            for i, rec in enumerate(coverage_analysis['recommendations'], 1):
                report += f"  {i}. {rec}\n"
        
        return report

