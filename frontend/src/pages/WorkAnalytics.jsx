import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../utils/services';
import { BarChart, TrendingUp, DollarSign, CheckCircle, Clock, Users } from 'lucide-react';

export default function WorkAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [workStats, dailySummary] = await Promise.all([
        analyticsAPI.getWorkStats(),
        analyticsAPI.getDailySummary()
      ]);

      setAnalytics({ workStats, dailySummary });
      setError(null);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
          <button 
            onClick={loadAnalytics}
            className="mt-2 text-red-600 hover:text-red-800 underline"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart className="h-6 w-6 text-blue-600" />
            Work Analytics
          </h1>
          <p className="text-gray-600 mt-1">Performance metrics and insights</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
        </div>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Works"
          value={analytics?.workStats?.overall?.total_works || 0}
          icon={<BarChart className="h-5 w-5" />}
          color="blue"
        />
        
        <StatCard
          title="Completed"
          value={analytics?.workStats?.overall?.completed_works || 0}
          icon={<CheckCircle className="h-5 w-5" />}
          color="green"
          subtitle={`${((analytics?.workStats?.overall?.completion_rate || 0)).toFixed(1)}% rate`}
        />
        
        <StatCard
          title="In Progress"
          value={analytics?.workStats?.overall?.in_progress_works || 0}
          icon={<Clock className="h-5 w-5" />}
          color="orange"
        />
        
        <StatCard
          title="Total Revenue"
          value={`$${(analytics?.workStats?.overall?.total_revenue || 0).toLocaleString()}`}
          icon={<DollarSign className="h-5 w-5" />}
          color="purple"
        />
      </div>

      {/* Category Analytics */}
      <div className="mb-8">
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Works by Category</h3>
          
          {analytics?.workStats?.by_category?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analytics.workStats.by_category.map(category => (
                <CategoryCard
                  key={category.id || 'uncategorized'}
                  category={category}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BarChart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No category data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Completion Trends */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Completion Trends</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">This Week</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: '75%' }}
                  ></div>
                </div>
                <span className="text-sm font-medium">75%</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">This Month</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: '68%' }}
                  ></div>
                </div>
                <span className="text-sm font-medium">68%</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Overall</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full" 
                    style={{ width: `${analytics?.workStats?.overall?.completion_rate || 0}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">
                  {(analytics?.workStats?.overall?.completion_rate || 0).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">5 works completed today</p>
                <p className="text-xs text-gray-600">Revenue: $2,850</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">3 new works created</p>
                <p className="text-xs text-gray-600">Potential value: $1,200</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
              <Users className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">2 workers assigned</p>
                <p className="text-xs text-gray-600">To pending works</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Summary */}
      {analytics?.dailySummary && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {analytics.dailySummary.works_count || 0}
              </div>
              <p className="text-sm text-gray-600">Works Today</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                ${(analytics.dailySummary.total_revenue || 0).toLocaleString()}
              </div>
              <p className="text-sm text-gray-600">Revenue Today</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {analytics.dailySummary.customers_count || 0}
              </div>
              <p className="text-sm text-gray-600">Active Customers</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, color, subtitle }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function CategoryCard({ category }) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center gap-3 mb-3">
        <div 
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: category.color }}
        />
        <h4 className="font-medium text-gray-900">{category.name || 'Uncategorized'}</h4>
      </div>
      
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div className="text-center">
          <div className="font-semibold text-gray-900">{category.total_works || 0}</div>
          <div className="text-gray-500">Total</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-green-600">{category.completed_works || 0}</div>
          <div className="text-gray-500">Done</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-blue-600">${(category.total_revenue || 0).toLocaleString()}</div>
          <div className="text-gray-500">Revenue</div>
        </div>
      </div>
    </div>
  );
}