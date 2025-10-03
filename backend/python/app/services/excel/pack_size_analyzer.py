"""
========================================
PACK SIZE ANALYZER - EXCEL MODULE
========================================

Purpose: Pack size analysis and ranking functionality for Excel operations

Description:
Handles comprehensive pack size analysis including ranking, categorization,
intelligent comparison, and RPI relevance determination. Implements business
logic for pack size intelligence across data sheets and provides insights
for competitive analysis and data organization.

Key Functionality:
- Pack size extraction and ranking from column names
- Pack size categorization (Sachet, Small, Medium, Large, Extra Large)
- RPI comparison priority calculation for intelligent analysis
- Pack size coverage analysis and gap identification
- Business insights generation for pack size relationships
- User-defined pack size ordering support

Business Logic:
- Hierarchical pack size ranking system (1=smallest, 5=largest)
- RPI comparison priorities based on pack size relationships
- Pack size category definitions with ML ranges
- Intelligent gap analysis for missing pack size coverage
- Business insights for competitive positioning

Dependencies:
- typing for type hints
- app.utils.packsize_utils for pack size utilities
- enum for pack size categories

Last Updated: 2024-12-23
Author: BrandBloom Backend Team
"""

from typing import Dict, List, Any, Optional
from enum import Enum

from app.utils.packsize_utils import PackSizeRanker, PackSizeRPIAnalyzer, extract_pack_size_from_column


class PackSizeCategory(Enum):
    """Pack size categories for classification"""
    SACHET = "Sachet"
    SMALL = "Small (150-250ML)"
    MEDIUM = "Medium (251-500ML)"
    LARGE = "Large (501-650ML)"
    EXTRA_LARGE = "Extra Large (>650ML)"
    UNKNOWN = "Unknown"


class PackSizeAnalyzer:
    """Handles pack size analysis and ranking for Excel operations"""
    
    @staticmethod
    def get_pack_size_rankings(column_names: List[str]) -> Dict[str, Any]:
        """
        Analyze pack sizes from column names and return ranking information.
        
        Args:
            column_names: List of column names to analyze
            
        Returns:
            Dictionary with pack size analysis and rankings
        """
        try:
            pack_size_data = []
            
            for col_name in column_names:
                pack_size = extract_pack_size_from_column(col_name)
                if pack_size:
                    pack_info = PackSizeRanker.get_pack_size_info(col_name)
                    pack_size_data.append({
                        'column_name': col_name,
                        'pack_size': pack_size,
                        'rank': pack_info['rank'],
                        'category': pack_info['category'].name,
                        'is_smallest': pack_info['is_smallest'],
                        'is_largest': pack_info['is_largest']
                    })
            
            # Sort by rank for logical ordering
            pack_size_data.sort(key=lambda x: x['rank'])
            
            # Generate summary statistics
            unique_sizes = list(set(item['pack_size'] for item in pack_size_data))
            sorted_unique_sizes = PackSizeRanker.sort_pack_sizes(unique_sizes)
            
            return {
                'total_columns': len(column_names),
                'columns_with_pack_size': len(pack_size_data),
                'pack_size_details': pack_size_data,
                'unique_pack_sizes': sorted_unique_sizes,
                'size_distribution': PackSizeAnalyzer._calculate_size_distribution(pack_size_data),
                'ranking_order': "1. Sachet (smallest) → 2. 150-250ML → 3. 251-500ML → 4. 501-650ML → 5. >650ML (largest)"
            }
            
        except Exception as e:
            print(f"❌ Error analyzing pack size rankings: {e}")
            return {
                'error': str(e),
                'total_columns': len(column_names),
                'columns_with_pack_size': 0,
                'pack_size_details': [],
                'unique_pack_sizes': [],
                'size_distribution': {},
                'ranking_order': "Error occurred during analysis"
            }
    
    @staticmethod
    def analyze_pack_size_coverage(
        main_pack_sizes: List[str], 
        rpi_pack_sizes: List[str],
        user_pack_size_order: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Analyze pack size coverage between main data and RPI data
        
        Args:
            main_pack_sizes: Pack sizes found in main data
            rpi_pack_sizes: Pack sizes found in RPI data
            user_pack_size_order: User-defined pack size ordering
            
        Returns:
            Dict with coverage analysis results
        """
        try:
            # Get unique pack sizes
            main_unique = list(set(main_pack_sizes))
            rpi_unique = list(set(rpi_pack_sizes))
            all_unique = list(set(main_unique + rpi_unique))
            
            # Analyze coverage
            coverage_analysis = {
                'main_pack_sizes': main_unique,
                'rpi_pack_sizes': rpi_unique,
                'all_pack_sizes': all_unique,
                'coverage_stats': {
                    'main_count': len(main_unique),
                    'rpi_count': len(rpi_unique),
                    'total_unique': len(all_unique),
                    'overlap_count': len(set(main_unique) & set(rpi_unique)),
                    'main_only': list(set(main_unique) - set(rpi_unique)),
                    'rpi_only': list(set(rpi_unique) - set(main_unique))
                }
            }
            
            # Calculate coverage percentage
            if main_unique:
                coverage_percentage = (coverage_analysis['coverage_stats']['overlap_count'] / 
                                     len(main_unique)) * 100
                coverage_analysis['coverage_percentage'] = coverage_percentage
            else:
                coverage_analysis['coverage_percentage'] = 0.0
            
            # Analyze gaps and recommendations
            coverage_analysis['gaps'] = PackSizeAnalyzer._identify_coverage_gaps(
                main_unique, rpi_unique, user_pack_size_order
            )
            
            coverage_analysis['recommendations'] = PackSizeAnalyzer._generate_coverage_recommendations(
                coverage_analysis
            )
            
            return coverage_analysis
            
        except Exception as e:
            print(f"❌ Error analyzing pack size coverage: {e}")
            return {
                'error': str(e),
                'coverage_percentage': 0.0,
                'recommendations': ['Error occurred during coverage analysis']
            }
    
    @staticmethod
    def get_rpi_relevance_analysis(
        main_pack_size: str,
        rpi_pack_sizes: List[str],
        user_pack_size_order: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Analyze RPI relevance for a specific main pack size
        
        Args:
            main_pack_size: Pack size from main data to analyze
            rpi_pack_sizes: Available RPI pack sizes
            user_pack_size_order: User-defined pack size ordering
            
        Returns:
            Dict with relevance analysis
        """
        try:
            relevant_rpis = []
            irrelevant_rpis = []
            
            # Get main pack size rank for comparison
            main_rank = PackSizeRanker.get_pack_size_rank(main_pack_size)
            
            for rpi_size in rpi_pack_sizes:
                rpi_rank = PackSizeRanker.get_pack_size_rank(rpi_size)
                
                # Check relevance using different methods
                relevance_checks = {
                    'rank_based': PackSizeAnalyzer._is_relevant_by_rank(main_rank, rpi_rank),
                    'user_order': PackSizeAnalyzer._is_relevant_by_user_order(
                        main_pack_size, rpi_size, user_pack_size_order
                    ) if user_pack_size_order else None,
                    'category_based': PackSizeAnalyzer._is_relevant_by_category(main_pack_size, rpi_size)
                }
                
                # Determine overall relevance
                is_relevant = (
                    relevance_checks['rank_based'] or
                    (relevance_checks['user_order'] is True) or
                    relevance_checks['category_based']
                )
                
                rpi_info = {
                    'pack_size': rpi_size,
                    'rank': rpi_rank,
                    'is_relevant': is_relevant,
                    'relevance_reasons': [k for k, v in relevance_checks.items() if v is True]
                }
                
                if is_relevant:
                    relevant_rpis.append(rpi_info)
                else:
                    irrelevant_rpis.append(rpi_info)
            
            return {
                'main_pack_size': main_pack_size,
                'main_rank': main_rank,
                'relevant_rpis': relevant_rpis,
                'irrelevant_rpis': irrelevant_rpis,
                'relevance_summary': {
                    'total_rpis': len(rpi_pack_sizes),
                    'relevant_count': len(relevant_rpis),
                    'relevance_percentage': (len(relevant_rpis) / len(rpi_pack_sizes) * 100) 
                                          if rpi_pack_sizes else 0
                }
            }
            
        except Exception as e:
            print(f"❌ Error analyzing RPI relevance: {e}")
            return {
                'error': str(e),
                'main_pack_size': main_pack_size,
                'relevant_rpis': [],
                'irrelevant_rpis': []
            }
    
    @staticmethod
    def generate_pack_size_insights(pack_size_data: Dict[str, Any]) -> List[str]:
        """
        Generate business insights from pack size analysis
        
        Args:
            pack_size_data: Pack size analysis data
            
        Returns:
            List of business insights
        """
        insights = []
        
        try:
            # Coverage insights
            coverage_pct = pack_size_data.get('coverage_percentage', 0)
            if coverage_pct >= 80:
                insights.append(f"Excellent pack size coverage: {coverage_pct:.1f}% of main pack sizes have RPI data")
            elif coverage_pct >= 60:
                insights.append(f"Good pack size coverage: {coverage_pct:.1f}% coverage with some gaps")
            else:
                insights.append(f"Limited pack size coverage: Only {coverage_pct:.1f}% coverage - consider adding more RPI data")
            
            # Gap analysis insights
            gaps = pack_size_data.get('gaps', {})
            critical_gaps = gaps.get('critical_gaps', [])
            if critical_gaps:
                insights.append(f"Critical pack size gaps identified: {', '.join(critical_gaps)}")
            
            # Distribution insights
            size_distribution = pack_size_data.get('size_distribution', {})
            dominant_category = max(size_distribution.items(), key=lambda x: x[1]) if size_distribution else None
            if dominant_category and dominant_category[1] > 0:
                insights.append(f"Pack size focus: {dominant_category[0]} is the dominant category with {dominant_category[1]} variants")
            
            # Recommendations
            recommendations = pack_size_data.get('recommendations', [])
            insights.extend(recommendations[:3])  # Add top 3 recommendations
            
        except Exception as e:
            insights.append(f"Error generating insights: {str(e)}")
        
        return insights
    
    @staticmethod
    def sort_pack_sizes_by_user_order(
        pack_sizes: List[str], 
        user_order: Optional[List[str]] = None
    ) -> List[str]:
        """
        Sort pack sizes according to user-defined order or default ranking
        
        Args:
            pack_sizes: List of pack sizes to sort
            user_order: User-defined ordering (optional)
            
        Returns:
            Sorted list of pack sizes
        """
        if not pack_sizes:
            return []
        
        if user_order:
            # Sort by user-defined order
            def sort_key(pack_size):
                try:
                    return user_order.index(pack_size)
                except ValueError:
                    return len(user_order)  # Put unknown sizes at the end
            
            return sorted(pack_sizes, key=sort_key)
        else:
            # Sort by default ranking system
            return PackSizeRanker.sort_pack_sizes(pack_sizes)
    
    @staticmethod
    def _calculate_size_distribution(pack_size_data: List[Dict[str, Any]]) -> Dict[str, int]:
        """Calculate distribution of pack sizes by category"""
        distribution = {
            'Sachet': 0,
            'Small (150-250ML)': 0,
            'Medium (251-500ML)': 0,
            'Large (501-650ML)': 0,
            'Extra Large (>650ML)': 0,
            'Unknown': 0
        }
        
        for item in pack_size_data:
            category = item.get('category', 'Unknown')
            if category in distribution:
                distribution[category] += 1
            else:
                distribution['Unknown'] += 1
        
        return distribution
    
    @staticmethod
    def _identify_coverage_gaps(
        main_sizes: List[str], 
        rpi_sizes: List[str],
        user_order: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Identify gaps in pack size coverage"""
        gaps = {
            'missing_in_rpi': list(set(main_sizes) - set(rpi_sizes)),
            'extra_in_rpi': list(set(rpi_sizes) - set(main_sizes)),
            'critical_gaps': [],
            'recommended_additions': []
        }
        
        # Identify critical gaps (main sizes without RPI coverage)
        if gaps['missing_in_rpi']:
            # Rank missing sizes by importance
            ranked_missing = PackSizeRanker.sort_pack_sizes(gaps['missing_in_rpi'])
            gaps['critical_gaps'] = ranked_missing[:3]  # Top 3 most important missing
        
        # Generate recommended additions
        if user_order:
            # Use user order to recommend adjacent sizes
            for main_size in main_sizes:
                if main_size not in rpi_sizes:
                    adjacent_sizes = PackSizeAnalyzer._get_adjacent_sizes_in_order(main_size, user_order)
                    gaps['recommended_additions'].extend(adjacent_sizes)
        
        return gaps
    
    @staticmethod
    def _generate_coverage_recommendations(coverage_analysis: Dict[str, Any]) -> List[str]:
        """Generate recommendations based on coverage analysis"""
        recommendations = []
        
        coverage_pct = coverage_analysis.get('coverage_percentage', 0)
        
        if coverage_pct < 50:
            recommendations.append("Consider adding RPI data for more pack sizes to improve analysis coverage")
        
        gaps = coverage_analysis.get('gaps', {})
        critical_gaps = gaps.get('critical_gaps', [])
        if critical_gaps:
            recommendations.append(f"Priority: Add RPI data for {', '.join(critical_gaps[:2])}")
        
        missing_count = len(gaps.get('missing_in_rpi', []))
        if missing_count > 0:
            recommendations.append(f"{missing_count} main pack sizes lack RPI comparison data")
        
        return recommendations
    
    @staticmethod
    def _is_relevant_by_rank(main_rank: int, rpi_rank: int) -> bool:
        """Check relevance based on pack size ranks"""
        if main_rank == 99 or rpi_rank == 99:  # Unknown ranks
            return False
        
        # Same rank is always relevant
        if main_rank == rpi_rank:
            return True
        
        # Adjacent ranks are relevant
        return abs(main_rank - rpi_rank) <= 1
    
    @staticmethod
    def _is_relevant_by_user_order(
        main_size: str, 
        rpi_size: str, 
        user_order: List[str]
    ) -> Optional[bool]:
        """Check relevance based on user-defined ordering"""
        if not user_order or main_size not in user_order or rpi_size not in user_order:
            return None
        
        main_pos = user_order.index(main_size)
        rpi_pos = user_order.index(rpi_size)
        
        # Same or adjacent positions are relevant
        return abs(main_pos - rpi_pos) <= 1
    
    @staticmethod
    def _is_relevant_by_category(main_size: str, rpi_size: str) -> bool:
        """Check relevance based on pack size categories"""
        main_category = PackSizeRanker.get_pack_size_category(main_size)
        rpi_category = PackSizeRanker.get_pack_size_category(rpi_size)
        
        # Same category is always relevant
        if main_category == rpi_category:
            return True
        
        # Adjacent categories are relevant
        category_order = [
            PackSizeCategory.SACHET,
            PackSizeCategory.SMALL,
            PackSizeCategory.MEDIUM,
            PackSizeCategory.LARGE,
            PackSizeCategory.EXTRA_LARGE
        ]
        
        try:
            main_idx = category_order.index(main_category)
            rpi_idx = category_order.index(rpi_category)
            return abs(main_idx - rpi_idx) <= 1
        except ValueError:
            return False
    
    @staticmethod
    def _get_adjacent_sizes_in_order(pack_size: str, user_order: List[str]) -> List[str]:
        """Get adjacent pack sizes in user-defined order"""
        if pack_size not in user_order:
            return []
        
        pos = user_order.index(pack_size)
        adjacent = []
        
        # Previous size
        if pos > 0:
            adjacent.append(user_order[pos - 1])
        
        # Next size
        if pos < len(user_order) - 1:
            adjacent.append(user_order[pos + 1])
        
        return adjacent
