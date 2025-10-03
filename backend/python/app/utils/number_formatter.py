"""
Number Formatting Utilities for BrandBloom Insights

This module provides utility functions for formatting numbers in a user-friendly way,
specifically for histogram displays and data visualization.

Key Features:
- Remove decimals for values over 1
- Convert large numbers to thousands/lacs format
- Maintain precision for small decimal values
- Handle edge cases and special values

Author: BrandBloom Backend Team
Last Updated: 2025-01-31
"""

def format_number_for_display(value: float, remove_decimals_threshold: float = 1.0) -> str:
    """
    Format a number for display in histograms and charts.
    
    Args:
        value: The numeric value to format
        remove_decimals_threshold: Values above this threshold will not show decimals
        
    Returns:
        Formatted string representation of the number with K/L/Cr format for large values
        
    Examples:
        >>> format_number_for_display(0.5)
        '0.5'
        >>> format_number_for_display(1.5)
        '2' (no decimal for values >= 1)
        >>> format_number_for_display(2.0)
        '2'
        >>> format_number_for_display(1500)
        '1.5K'
        >>> format_number_for_display(150000)
        '1.5L'
        >>> format_number_for_display(15000000)
        '1.5Cr'
    """
    if value is None or value != value:  # Check for NaN
        return '0'
    
    # Handle zero and very small values
    if abs(value) < 0.01 and value != 0:
        return f"{value:.3f}"
    
    # For values below threshold, show appropriate decimals
    if abs(value) < remove_decimals_threshold:
        if value == int(value):
            return str(int(value))
        elif abs(value) < 0.1:
            return f"{value:.3f}"
        else:
            return f"{value:.2f}"
    
    # For values above threshold, remove decimals if they're whole numbers
    if value == int(value):
        return str(int(value))
    
    # For large numbers, use K/L/Cr format (NO decimals for values >= 1)
    abs_value = abs(value)
    if abs_value >= 100000:  # 1 Lakh or more
        if abs_value >= 10000000:  # 1 Crore or more
            # For crores, use K/L/Cr format without decimals
            formatted = f"{round(value/10000000)} Cr"
        else:
            # For lakhs, use K/L/Cr format without decimals
            formatted = f"{round(value/100000)} L"
    elif abs_value >= 1000:  # 1 Thousand or more
        formatted = f"{round(value/1000)} K"
    else:
        # For values between 1 and 1000, round to nearest integer (NO decimals)
        formatted = str(round(value))
    
    return formatted

def add_commas(value: int) -> str:
    """
    Add standard comma separation to numbers (1,234,567).
    
    Args:
        value: Integer value to format
        
    Returns:
        String with comma separation
    """
    return f"{value:,}"

def add_commas_indian(value: float) -> str:
    """
    Add Indian comma separation to numbers (1,50,000).
    
    Args:
        value: Numeric value to format
        
    Returns:
        String with Indian comma separation
    """
    if value == int(value):
        # For whole numbers, use Indian comma system
        num_str = str(int(value))
        if len(num_str) <= 3:
            return num_str
        
        # Indian numbering system: last 3 digits, then groups of 2
        result = num_str[-3:]  # Last 3 digits
        remaining = num_str[:-3]
        
        while remaining:
            if len(remaining) <= 2:
                result = remaining + ',' + result
                break
            result = remaining[-2:] + ',' + result
            remaining = remaining[:-2]
        
        return result
    else:
        # For decimal numbers, format the whole part with commas and keep decimals
        whole_part = int(value)
        decimal_part = value - whole_part
        
        formatted_whole = add_commas_indian(whole_part)
        if decimal_part != 0:
            # Keep up to 2 decimal places
            decimal_str = f"{decimal_part:.2f}".lstrip('0')
            return formatted_whole + decimal_str
        return formatted_whole

def format_currency(value: float, currency_symbol: str = "₹") -> str:
    """
    Format a number as currency with proper comma separation.
    
    Args:
        value: The numeric value to format
        currency_symbol: Currency symbol to prepend
        
    Returns:
        Formatted currency string
        
    Examples:
        >>> format_currency(1500.50)
        '₹1,500.50'
        >>> format_currency(150000)
        '₹1,50,000'
    """
    if value is None or value != value:  # Check for NaN
        return f"{currency_symbol}0"
    
    if value == int(value):
        return f"{currency_symbol}{add_commas_indian(int(value))}"
    else:
        # For decimal values, use standard comma separation for better readability
        return f"{currency_symbol}{value:,.2f}"

def format_histogram_bin_label(value: float) -> str:
    """
    Format a histogram bin label specifically for display.
    For histogram bin labels, use K/L/Cr format for big numbers, NO decimals for values >= 1
    
    Args:
        value: The numeric value to format
        
    Returns:
        Formatted string for histogram bin labels
        
    Examples:
        >>> format_histogram_bin_label(0.5)
        '0.5'
        >>> format_histogram_bin_label(1.5)
        '2' (no decimal for values >= 1)
        >>> format_histogram_bin_label(1500)
        '1.5K'
        >>> format_histogram_bin_label(150000)
        '1.5L'
    """
    # For histogram bin labels, use K/L/Cr format for big numbers, NO decimals for values >= 1
    abs_value = abs(value)
    if abs_value >= 100000:  # 1 Lakh or more
        if abs_value >= 10000000:  # 1 Crore or more
            return f"{round(value/10000000)} Cr"
        else:
            return f"{round(value/100000)} L"
    elif abs_value >= 1000:  # 1 Thousand or more
        return f"{round(value/1000)} K"
    elif abs_value >= 1:
        # For values between 1 and 1000, round to nearest integer and remove decimals
        return str(round(value))
    else:
        # For values < 1, show appropriate decimals
        return format_number_for_display(value, remove_decimals_threshold=1.0)

def format_histogram_range_label(start_value: float, end_value: float) -> str:
    """
    Format a histogram range label (start-end).
    
    Args:
        start_value: The start value of the bin
        end_value: The end value of the bin
        
    Returns:
        Formatted string for histogram range labels
    """
    start_formatted = format_histogram_bin_label(start_value)
    end_formatted = format_histogram_bin_label(end_value)
    return f"{start_formatted}-{end_formatted}"


def format_percentage(value: float, show_percent_sign: bool = True) -> str:
    """
    Format a percentage value with K/L/Cr formatting for large values.
    
    Args:
        value: The percentage value (0-1 for 0-100%)
        show_percent_sign: Whether to append % symbol
        
    Returns:
        Formatted percentage string
        
    Examples:
        >>> format_percentage(0.05)
        '5%'
        >>> format_percentage(0.15)
        '15%'
        >>> format_percentage(1.5)
        '150%'
        >>> format_percentage(15.0)
        '15K%'
        >>> format_percentage(150.0)
        '150L%'
    """
    if value is None or value != value:  # Check for NaN
        return '0%' if show_percent_sign else '0'
    
    # Convert to percentage (0-1 to 0-100)
    percentage_value = value * 100
    
    # For small percentages (< 1%), show with 1 decimal place
    if abs(percentage_value) < 1:
        formatted = f"{percentage_value:.1f}"
        return f"{formatted}%" if show_percent_sign else formatted
    
    # For larger percentages, apply K/L/Cr formatting without decimals
    abs_value = abs(percentage_value)
    
    if abs_value >= 100000:  # 1 Lakh % or more
        if abs_value >= 10000000:  # 1 Crore % or more
            formatted = f"{round(percentage_value/10000000)} Cr"
        else:
            formatted = f"{round(percentage_value/100000)} L"
    elif abs_value >= 1000:  # 1 Thousand % or more
        formatted = f"{round(percentage_value/1000)} K"
    else:
        # For values between 1% and 1000%, show as whole numbers
        formatted = str(round(percentage_value))
    
    return f"{formatted}%" if show_percent_sign else formatted
