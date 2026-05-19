'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { Search, Plus, Loader2, AlertTriangle, Package, CheckCircle, TrendingUp, Sparkles, Pencil, Trash2, X } from 'lucide-react';

export default function StockIntelligencePage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchFilter, setSearchFilter] = useState('');
  
  // Seasonal Rule Modal State
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [ruleForm, setRuleForm] = useState({
    name: '',
    tags: '',
    months: [] as number[],
    categories: [] as string[],
    demandMultiplier: 1.0,
    description: '',
    isActive: true
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/admin/categories');
      return res.data.data.categories;
    },
  });

  const { data: forecastData, isLoading: isLoadingForecast } = useQuery({
    queryKey: ['admin-stock-forecast'],
    queryFn: async () => {
      const res = await api.get('/admin/stock/forecast');
      return res.data.data;
    },
  });

  const { data: rulesData, isLoading: isLoadingRules } = useQuery({
    queryKey: ['admin-seasonal-rules'],
    queryFn: async () => {
      const res = await api.get('/admin/stock/seasonal-rules');
      return res.data.data.rules;
    },
  });

  const saveRuleMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = { ...data, tags: data.tags.split(',').map((t: string) => t.trim()).filter(Boolean) };
      if (editingRule) {
        return api.patch(`/admin/stock/seasonal-rules/${editingRule._id}`, payload);
      }
      return api.post('/admin/stock/seasonal-rules', payload);
    },
    onSuccess: () => {
      toast.success(editingRule ? 'Rule updated' : 'Rule created');
      queryClient.invalidateQueries({ queryKey: ['admin-seasonal-rules'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stock-forecast'] });
      closeRuleModal();
    },
    onError: () => toast.error('Failed to save rule'),
  });

  const deleteRuleMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/stock/seasonal-rules/${id}`),
    onSuccess: () => {
      toast.success('Rule deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-seasonal-rules'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stock-forecast'] });
    },
    onError: () => toast.error('Failed to delete rule'),
  });

  const openRuleModal = (rule?: any) => {
    if (rule) {
      setEditingRule(rule);
      setRuleForm({
        name: rule.name,
        tags: rule.tags.join(', '),
        months: rule.months,
        categories: rule.categories || [],
        demandMultiplier: rule.demandMultiplier,
        description: rule.description,
        isActive: rule.isActive
      });
    } else {
      setEditingRule(null);
      setRuleForm({ name: '', tags: '', months: [], categories: [], demandMultiplier: 1.0, description: '', isActive: true });
    }
    setIsRuleModalOpen(true);
  };

  const closeRuleModal = () => setIsRuleModalOpen(false);

  const toggleMonth = (m: number) => {
    setRuleForm(prev => ({
      ...prev,
      months: prev.months.includes(m) ? prev.months.filter(x => x !== m) : [...prev.months, m].sort((a,b)=>a-b)
    }));
  };

  const toggleCategory = (catId: string) => {
    setRuleForm(prev => ({
      ...prev,
      categories: prev.categories.includes(catId)
        ? prev.categories.filter(id => id !== catId)
        : [...prev.categories, catId]
    }));
  };

  const seasonIcons: Record<string, string> = {
    'Spring': '🌸',
    'Summer': '☀️',
    'Autumn': '🍂',
    'Post Holiday': '❄️',
    'Holiday Season': '🎄',
  };

  const filteredProducts = forecastData?.products?.filter((p: any) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (searchFilter && !p.productName.toLowerCase().includes(searchFilter.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Stock Intelligence</h1>
        <p className="text-sm text-text-secondary mt-1">AI-powered seasonal demand forecasting</p>
      </div>

      {/* Section 1: Season Banner */}
      {forecastData?.summary && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="text-5xl">{seasonIcons[forecastData.summary.currentSeason] || '🌤'}</div>
            <div>
              <h2 className="text-xl font-bold text-indigo-900">Current Season: {forecastData.summary.currentSeason}</h2>
              <p className="text-sm text-indigo-700 mt-1">AI multipliers are actively adjusting your demand forecasts based on active rules.</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap max-w-sm justify-end">
            {rulesData?.filter((r: any) => r.isActive && r.months.includes(new Date().getMonth() + 1)).map((r: any) => (
              <span key={r._id} className="bg-white border border-indigo-200 text-indigo-800 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm">
                {r.name}: <span className="text-indigo-500">{r.demandMultiplier}x</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Section 2: Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-red-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-red-600 mb-1">Critical (under 7 days)</p>
            <h3 className="text-3xl font-bold text-red-700">{forecastData?.summary?.critical || 0}</h3>
          </div>
          <div className="p-3 bg-red-100 rounded-full"><AlertTriangle className="w-6 h-6 text-red-600" /></div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-orange-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-orange-600 mb-1">Low (under 30 days)</p>
            <h3 className="text-3xl font-bold text-orange-700">{forecastData?.summary?.low || 0}</h3>
          </div>
          <div className="p-3 bg-orange-100 rounded-full"><TrendingUp className="w-6 h-6 text-orange-600" /></div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-green-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-green-600 mb-1">Healthy</p>
            <h3 className="text-3xl font-bold text-green-700">{forecastData?.summary?.healthy || 0}</h3>
          </div>
          <div className="p-3 bg-green-100 rounded-full"><CheckCircle className="w-6 h-6 text-green-600" /></div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-blue-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600 mb-1">Overstocked</p>
            <h3 className="text-3xl font-bold text-blue-700">{forecastData?.summary?.overstocked || 0}</h3>
          </div>
          <div className="p-3 bg-blue-100 rounded-full"><Package className="w-6 h-6 text-blue-600" /></div>
        </div>
      </div>

      {/* Section 3: Products Forecast Table */}
      <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" /> AI Stock Forecast
          </h2>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input type="text" placeholder="Search products..." value={searchFilter} onChange={e => setSearchFilter(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-border rounded-lg px-3 py-2 text-sm bg-white">
              <option value="all">All Statuses</option>
              <option value="critical">Critical</option>
              <option value="low">Low</option>
              <option value="healthy">Healthy</option>
              <option value="overstocked">Overstocked</option>
              <option value="no_sales">No Sales</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-xs text-text-secondary uppercase border-b border-border">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Current Stock</th>
                <th className="px-4 py-3 font-medium">Base Sales/d</th>
                <th className="px-4 py-3 font-medium">Multiplier</th>
                <th className="px-4 py-3 font-medium">Adj. Sales/d</th>
                <th className="px-4 py-3 font-medium">Days Left</th>
                <th className="px-4 py-3 font-medium">Restock Qty</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoadingForecast ? (
                <tr><td colSpan={8} className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></td></tr>
              ) : filteredProducts?.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-text-secondary">No products match your filters</td></tr>
              ) : (
                filteredProducts?.map((p: any) => (
                  <tr key={p.productId} className={`hover:bg-gray-50 transition-colors ${p.status === 'critical' ? 'bg-red-50/20' : p.status === 'low' ? 'bg-orange-50/20' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.productImage ? <img src={p.productImage} className="w-10 h-10 rounded object-cover" /> : <div className="w-10 h-10 rounded bg-gray-100" />}
                        <div>
                          <p className="font-medium text-text-primary line-clamp-1">{p.productName}</p>
                          <p className="text-xs text-text-secondary">{p.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold">{p.currentStock}</td>
                    <td className="px-4 py-3 text-text-secondary">{p.baseDailySales}</td>
                    <td className="px-4 py-3">
                      {p.isEvergreen ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">🌿 1.0x</span>
                      ) : p.seasonalMultiplier !== 1 ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">{p.seasonalMultiplier}x</span>
                      ) : (
                        <span className="text-xs text-text-secondary">1.0x</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">{p.adjustedDailySales}</td>
                    <td className="px-4 py-3">
                      <span className={`font-bold ${p.status === 'critical' ? 'text-red-600' : p.status === 'low' ? 'text-orange-600' : 'text-green-600'}`}>
                        {p.daysOfStockLeft > 900 ? '∞' : p.daysOfStockLeft}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-blue-600 font-semibold">{p.recommendedRestockQty > 0 ? `+${p.recommendedRestockQty}` : '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-[10px] uppercase tracking-wider font-bold rounded-md ${
                        p.status === 'critical' ? 'bg-red-100 text-red-700' :
                        p.status === 'low' ? 'bg-orange-100 text-orange-700' :
                        p.status === 'healthy' ? 'bg-green-100 text-green-700' :
                        p.status === 'overstocked' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {p.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 4: Seasonal Rules Manager */}
      <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border flex justify-between items-center">
          <h2 className="text-lg font-bold text-text-primary">Seasonal Rules</h2>
          <button onClick={() => openRuleModal()} className="flex items-center px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-light transition gap-1.5">
            <Plus className="w-4 h-4" /> Add Rule
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-xs text-text-secondary uppercase border-b border-border">
              <tr>
                <th className="px-5 py-3 font-medium">Rule Name</th>
                <th className="px-5 py-3 font-medium">Tags</th>
                <th className="px-5 py-3 font-medium">Months</th>
                <th className="px-5 py-3 font-medium">Multiplier</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoadingRules ? (
                <tr><td colSpan={6} className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></td></tr>
              ) : rulesData?.map((rule: any) => (
                <tr key={rule._id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-text-primary">{rule.name}</p>
                    <p className="text-xs text-text-secondary truncate max-w-[200px]">{rule.description}</p>
                  </td>
                  <td className="px-5 py-3 text-xs text-text-secondary max-w-[150px] truncate">{rule.tags.join(', ') || 'Global'}</td>
                  <td className="px-5 py-3 text-xs text-text-secondary">{rule.months.join(', ')}</td>
                  <td className="px-5 py-3 font-semibold text-purple-600">{rule.demandMultiplier}x</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${rule.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {rule.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openRuleModal(rule)} className="p-1.5 text-text-secondary hover:text-primary rounded-lg transition"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => { if(confirm('Delete rule?')) deleteRuleMutation.mutate(rule._id); }} className="p-1.5 text-text-secondary hover:text-red-500 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rule Modal */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-text-primary">{editingRule ? 'Edit Rule' : 'New Seasonal Rule'}</h2>
              <button onClick={closeRuleModal} className="p-2 text-text-secondary hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Rule Name</label>
                <input type="text" value={ruleForm.name} onChange={e => setRuleForm(prev => ({...prev, name: e.target.value}))} className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
                <input type="text" value={ruleForm.tags} onChange={e => setRuleForm(prev => ({...prev, tags: e.target.value}))} placeholder="summer, t-shirt, electronics" className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
                <p className="text-xs text-text-secondary mt-1">Leave empty to apply globally</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Apply to Categories (optional)
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Rule applies to ALL products in selected categories
                </p>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {categories.map((cat: any) => (
                    <label key={cat._id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={ruleForm.categories.includes(cat._id)}
                        onChange={() => toggleCategory(cat._id)}
                        className="rounded border-gray-300"
                      />
                      {cat.name}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Active Months</label>
                <div className="flex flex-wrap gap-2">
                  {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                    <button key={m} type="button" onClick={() => toggleMonth(i+1)} className={`px-3 py-1 text-xs font-semibold rounded-full border ${ruleForm.months.includes(i+1) ? 'bg-primary text-white border-primary' : 'bg-white text-text-secondary border-border'}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Demand Multiplier</label>
                <input type="number" min="0.1" max="5.0" step="0.1" value={ruleForm.demandMultiplier} onChange={e => setRuleForm(prev => ({...prev, demandMultiplier: parseFloat(e.target.value)}))} className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
                <p className="text-xs text-text-secondary mt-1">1.0 = normal | 1.5 = 50% more | 2.0 = double | 0.5 = half demand</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea rows={2} value={ruleForm.description} onChange={e => setRuleForm(prev => ({...prev, description: e.target.value}))} className="w-full border border-border rounded-lg px-3 py-2 text-sm resize-none" />
              </div>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" checked={ruleForm.isActive} onChange={e => setRuleForm(prev => ({...prev, isActive: e.target.checked}))} className="rounded" /> Active
              </label>
            </div>
            <div className="p-6 border-t border-border flex justify-end gap-3 bg-gray-50 sticky bottom-0">
              <button onClick={closeRuleModal} className="px-4 py-2 border border-border rounded-lg text-sm font-medium text-text-secondary hover:bg-gray-100">Cancel</button>
              <button onClick={() => saveRuleMutation.mutate(ruleForm)} disabled={saveRuleMutation.isPending || !ruleForm.name} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50">
                {saveRuleMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Rule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
