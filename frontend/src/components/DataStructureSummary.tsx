/**
 * ========================================
 * DATA STRUCTURE SUMMARY COMPONENT
 * ========================================
 * 
 * Purpose: Persistent data structure summary display for non-MMM analysis
 * 
 * Description:
 * This component displays a persistent summary of the uploaded data structure,
 * showing column count, row count, and column names. It remains visible throughout
 * the analysis workflow to provide context.
 * 
 * Key Features:
 * - Shows total columns and rows
 * - Displays column names as interactive tags
 * - Includes helpful lightbulb icon with guidance text
 * - Persists across steps (doesn't disappear)
 * 
 * Last Updated: 2025-10-03
 * Author: BrandBloom Frontend Team
 */

import React from 'react';
import { FileText, Lightbulb } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DataStructureSummaryProps {
  columns: string[];
  rowCount: number;
  className?: string;
}

export function DataStructureSummary({ columns, rowCount, className = '' }: DataStructureSummaryProps) {
  return (
    <Card className={`border-primary/20 bg-primary/5 ${className}`}>
      <CardContent className="pt-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold text-gray-900">
            Data Structure ({columns.length} columns)
          </h3>
          <Badge variant="secondary" className="ml-auto">
            {rowCount.toLocaleString()} rows
          </Badge>
        </div>

        {/* Column Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {columns.map((column, index) => (
            <span
              key={index}
              className="px-2.5 py-1 bg-white border border-gray-200 rounded-md text-xs font-medium text-gray-700 hover:border-primary/50 hover:bg-primary/5 transition-colors"
            >
              {column}
            </span>
          ))}
        </div>

        {/* Helpful Text with Lightbulb */}
        <div className="flex items-start gap-2 p-2 bg-accent/5 border border-accent/20 rounded-md">
          <Lightbulb className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
          <p className="text-xs text-accent/90">
            Ask me about specific columns or relationships in your data!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

