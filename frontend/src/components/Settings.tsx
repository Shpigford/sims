import { useState, useEffect } from 'react';

interface SettingsProps {
  settings: {
    spool_weight: number;
    filament_markup: number;
    hourly_rate: number;
    wear_tear_markup: number;
    platform_fees: number;
    filament_spool_price: number;
    desired_profit_margin: number;
    packaging_cost: number;
    wear_tear_percentage?: number;
    platform_fee_percentage?: number;
    default_markup?: number;
    global_spool_price?: number;
    [key: string]: number | undefined;
  };
  onUpdateSettings: (newSettings: any) => void;
}

const Settings = ({ settings, onUpdateSettings }: SettingsProps) => {
  const [formSettings, setFormSettings] = useState(settings);
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  useEffect(() => {
    setFormSettings(settings);
  }, [settings]);

  const handleChange = (key: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) || value === '') {
      setFormSettings({
        ...formSettings,
        [key]: value === '' ? 0 : numValue
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('saving');
    
    try {
      await onUpdateSettings(formSettings);
      setSaveStatus('success');
      setIsEditing(false);
      
      // Reset save status after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    } catch (error) {
      setSaveStatus('error');
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold uppercase tracking-wider">SYSTEM SETTINGS</h1>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-blue-600 text-white border border-black text-xs font-bold uppercase tracking-wider"
          >
            EDIT SETTINGS
          </button>
        ) : null}
      </div>
      
      {saveStatus === 'success' && (
        <div className="bg-green-100 border border-green-500 text-green-700 p-2 mb-4">
          Settings saved successfully!
        </div>
      )}
      
      {saveStatus === 'error' && (
        <div className="bg-red-100 border border-red-500 text-red-700 p-2 mb-4">
          Error saving settings. Please try again.
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6 pb-6">
        <div className="border-2 border-black">
          <div className="bg-black text-white p-2 text-xs font-medium uppercase tracking-wider">
            General Settings
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Spool Weight (g)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={formSettings.spool_weight}
                onChange={(e) => handleChange('spool_weight', e.target.value)}
                disabled={!isEditing}
                className="w-full p-2 border border-black bg-white text-black disabled:bg-gray-100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Hourly Rate ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formSettings.hourly_rate}
                onChange={(e) => handleChange('hourly_rate', e.target.value)}
                disabled={!isEditing}
                className="w-full p-2 border border-black bg-white text-black disabled:bg-gray-100"
              />
            </div>
          </div>
        </div>
        
        <div className="border-2 border-black">
          <div className="bg-black text-white p-2 text-xs font-medium uppercase tracking-wider">
            Cost Settings
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Filament Spool Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formSettings.filament_spool_price}
                onChange={(e) => handleChange('filament_spool_price', e.target.value)}
                disabled={!isEditing}
                className="w-full p-2 border border-black bg-white text-black disabled:bg-gray-100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Global Spool Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formSettings.global_spool_price ?? formSettings.filament_spool_price}
                onChange={(e) => handleChange('global_spool_price', e.target.value)}
                disabled={!isEditing}
                className="w-full p-2 border border-black bg-white text-black disabled:bg-gray-100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Packaging Cost ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formSettings.packaging_cost}
                onChange={(e) => handleChange('packaging_cost', e.target.value)}
                disabled={!isEditing}
                className="w-full p-2 border border-black bg-white text-black disabled:bg-gray-100"
              />
            </div>
          </div>
        </div>
        
        <div className="border-2 border-black">
          <div className="bg-black text-white p-2 text-xs font-medium uppercase tracking-wider">
            Markup & Fees
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Filament Markup (%)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={formSettings.filament_markup}
                onChange={(e) => handleChange('filament_markup', e.target.value)}
                disabled={!isEditing}
                className="w-full p-2 border border-black bg-white text-black disabled:bg-gray-100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Wear & Tear Markup (%)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={formSettings.wear_tear_markup}
                onChange={(e) => handleChange('wear_tear_markup', e.target.value)}
                disabled={!isEditing}
                className="w-full p-2 border border-black bg-white text-black disabled:bg-gray-100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Wear & Tear Percentage (0-1)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={formSettings.wear_tear_percentage ?? (formSettings.wear_tear_markup / 100)}
                onChange={(e) => handleChange('wear_tear_percentage', e.target.value)}
                disabled={!isEditing}
                className="w-full p-2 border border-black bg-white text-black disabled:bg-gray-100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Desired Markup (%)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={formSettings.desired_markup ?? (formSettings.desired_profit_margin * 2)}
                onChange={(e) => handleChange('desired_markup', e.target.value)}
                disabled={!isEditing}
                className="w-full p-2 border border-black bg-white text-black disabled:bg-gray-100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Default Markup (0-1)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={formSettings.default_markup ?? (formSettings.desired_markup / 100)}
                onChange={(e) => handleChange('default_markup', e.target.value)}
                disabled={!isEditing}
                className="w-full p-2 border border-black bg-white text-black disabled:bg-gray-100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Desired Profit Margin (%)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={formSettings.desired_profit_margin}
                onChange={(e) => handleChange('desired_profit_margin', e.target.value)}
                disabled={!isEditing}
                className="w-full p-2 border border-black bg-white text-black disabled:bg-gray-100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Platform Fees (%)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={formSettings.platform_fees}
                onChange={(e) => handleChange('platform_fees', e.target.value)}
                disabled={!isEditing}
                className="w-full p-2 border border-black bg-white text-black disabled:bg-gray-100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Platform Fee Percentage (0-1)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={formSettings.platform_fee_percentage ?? (formSettings.platform_fees / 100)}
                onChange={(e) => handleChange('platform_fee_percentage', e.target.value)}
                disabled={!isEditing}
                className="w-full p-2 border border-black bg-white text-black disabled:bg-gray-100"
              />
            </div>
          </div>
        </div>
        
        {isEditing && (
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => {
                setFormSettings(settings);
                setIsEditing(false);
              }}
              className="px-4 py-2 bg-gray-600 text-white border border-black text-xs font-bold uppercase tracking-wider"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={saveStatus === 'saving'}
              className="px-4 py-2 bg-green-600 text-white border border-black text-xs font-bold uppercase tracking-wider"
            >
              {saveStatus === 'saving' ? 'SAVING...' : 'SAVE SETTINGS'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default Settings;