"""
========================================
EXPECTED SIGNS SERVICE
========================================

Purpose: Calculate expected signs for variables based on category and brand relationships

Description:
This service implements the business logic for determining expected signs (positive/negative)
and appropriate color coding for variables in different categories based on their relationship
to our brand, competitors, and halo brands. Used in marketing mix modeling analysis.

Business Rules:
1. Distribution: Our brand (+, green), Other brands (-, red)
2. Pricing: Our brand (-, red), Other brands (+, green), RPI variables (all red)
3. Promotion: Our brand (+, green), Other brands (-, red)
4. Media: Our brand (+, green), Competitors (-, red), Halo brands (+, blue)

Last Updated: 2024-12-23
Author: BrandBloom Backend Team
"""

import re
from typing import Dict, List, Optional
from app.models.data_models import (
    BrandCategories, 
    VariableExpectedSign, 
    ExpectedSignsMap,
    ColumnCategories
)

def extract_brand_from_variable(variable_name: str) -> str:
    """Extract brand name from variable name by removing common prefixes"""
    prefixes_to_remove = [
        r'^Volume\s+',
        r'^Value\s+', 
        r'^Units?\s+',
        r'^Vol\s+',
        r'^Val\s+',
        r'^Unit\s+',
        r'^WTD\s+',
        r'^Price\s+per\s+ml\s+',
        r'^Price\s+',
        r'^RPI\s+',
        r'^Promo\s+',
        r'^TUP\s+',
        r'^BTL\s+',
        r'^GRP\s+',
        r'^Spend\s+'
    ]
    
    brand_name = variable_name.strip()
    for prefix in prefixes_to_remove:
        brand_name = re.sub(prefix, '', brand_name, flags=re.IGNORECASE)
    
    # Clean up excessive whitespace and common suffixes
    brand_name = re.sub(r'\s+', ' ', brand_name)
    brand_name = re.sub(r'\s+(Sachet|Entire Brand|150-250ML|251-500ML)$', '', brand_name, flags=re.IGNORECASE)
    
    return brand_name.strip()

def get_brand_category(variable_name: str, brand_categories: BrandCategories) -> str:
    """Determine which brand category a variable belongs to"""
    brand_from_variable = extract_brand_from_variable(variable_name).lower()
    
    if brand_from_variable == brand_categories.ourBrand.lower():
        return 'our'
    
    if any(comp.lower() == brand_from_variable for comp in brand_categories.competitors):
        return 'competitor'
    
    if any(halo.lower() == brand_from_variable for halo in brand_categories.haloBrands):
        return 'halo'
    
    return 'unknown'

def get_distribution_expected_sign(variable_name: str, brand_categories: BrandCategories) -> VariableExpectedSign:
    """Rule: Our brand (+, green), Other brands (-, red)"""
    brand_category = get_brand_category(variable_name, brand_categories)
    
    if brand_category == 'our':
        return VariableExpectedSign(
            variable=variable_name,
            category='Distribution',
            expectedSign='+',
            color='green',
            reason='Our brand distribution has positive impact'
        )
    else:
        return VariableExpectedSign(
            variable=variable_name,
            category='Distribution',
            expectedSign='-',
            color='red',
            reason='Competitor/other brand distribution has negative impact'
        )

def get_pricing_expected_sign(variable_name: str, brand_categories: BrandCategories) -> VariableExpectedSign:
    """Rule: Our brand (-, red), Other brands (+, green), RPI variables (all red)"""
    # Special case: RPI variables are always red
    if re.search(r'RPI', variable_name, re.IGNORECASE):
        return VariableExpectedSign(
            variable=variable_name,
            category='Pricing',
            expectedSign='-',
            color='red',
            reason='RPI variables always have negative expected sign'
        )
    
    brand_category = get_brand_category(variable_name, brand_categories)
    
    if brand_category == 'our':
        return VariableExpectedSign(
            variable=variable_name,
            category='Pricing',
            expectedSign='-',
            color='red',
            reason='Our brand price increase has negative impact on volume'
        )
    else:
        return VariableExpectedSign(
            variable=variable_name,
            category='Pricing',
            expectedSign='+',
            color='green',
            reason='Competitor price increase has positive impact on our volume'
        )

def get_promotion_expected_sign(variable_name: str, brand_categories: BrandCategories) -> VariableExpectedSign:
    """Rule: Our brand (+, green), Other brands (-, red)"""
    brand_category = get_brand_category(variable_name, brand_categories)
    
    if brand_category == 'our':
        return VariableExpectedSign(
            variable=variable_name,
            category='Promotion',
            expectedSign='+',
            color='green',
            reason='Our brand promotions have positive impact'
        )
    else:
        return VariableExpectedSign(
            variable=variable_name,
            category='Promotion',
            expectedSign='-',
            color='red',
            reason='Competitor promotions have negative impact on our brand'
        )

def get_media_expected_sign(variable_name: str, brand_categories: BrandCategories) -> VariableExpectedSign:
    """Rule: Our brand (+, green), Competitors (-, red), Halo brands (+, blue)"""
    brand_category = get_brand_category(variable_name, brand_categories)
    
    if brand_category == 'our':
        return VariableExpectedSign(
            variable=variable_name,
            category='Media',
            expectedSign='+',
            color='green',
            reason='Our brand media has positive impact'
        )
    elif brand_category == 'competitor':
        return VariableExpectedSign(
            variable=variable_name,
            category='Media',
            expectedSign='-',
            color='red',
            reason='Competitor media has negative impact on our brand'
        )
    elif brand_category == 'halo':
        return VariableExpectedSign(
            variable=variable_name,
            category='Media',
            expectedSign='+',
            color='blue',
            reason='Halo brand media has positive impact'
        )
    else:
        return VariableExpectedSign(
            variable=variable_name,
            category='Media',
            expectedSign='+',
            color='green',
            reason='Unknown brand media - default positive'
        )

def calculate_expected_signs(
    column_categories: ColumnCategories, 
    brand_categories: BrandCategories
) -> ExpectedSignsMap:
    """Calculate expected signs for all variables in specified categories"""
    expected_signs = {}
    
    # Process Distribution variables
    if hasattr(column_categories, 'Distribution') and column_categories.Distribution:
        for variable in column_categories.Distribution:
            expected_signs[variable] = get_distribution_expected_sign(variable, brand_categories)
    
    # Process Pricing variables
    if hasattr(column_categories, 'Pricing') and column_categories.Pricing:
        for variable in column_categories.Pricing:
            expected_signs[variable] = get_pricing_expected_sign(variable, brand_categories)
    
    # Process Promotion variables
    if hasattr(column_categories, 'Promotion') and column_categories.Promotion:
        for variable in column_categories.Promotion:
            expected_signs[variable] = get_promotion_expected_sign(variable, brand_categories)
    
    # Process Media variables
    if hasattr(column_categories, 'Media') and column_categories.Media:
        for variable in column_categories.Media:
            expected_signs[variable] = get_media_expected_sign(variable, brand_categories)
    
    return ExpectedSignsMap(signs=expected_signs)

def get_expected_sign_for_variable(
    variable_name: str,
    category: str, 
    brand_categories: BrandCategories
) -> Optional[VariableExpectedSign]:
    """Get expected sign for a specific variable"""
    category_lower = category.lower()
    
    if category_lower == 'distribution':
        return get_distribution_expected_sign(variable_name, brand_categories)
    elif category_lower == 'pricing':
        return get_pricing_expected_sign(variable_name, brand_categories)
    elif category_lower == 'promotion':
        return get_promotion_expected_sign(variable_name, brand_categories)
    elif category_lower == 'media':
        return get_media_expected_sign(variable_name, brand_categories)
    else:
        return None
