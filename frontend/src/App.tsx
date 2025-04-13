import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation, Routes, Route } from 'react-router-dom'
import FilamentList from './components/FilamentList'
import FilamentForm from './components/FilamentForm'
import PrintQueue from './components/PrintQueue'
import PurchaseList from './components/PurchaseList'
import PartList from './components/PartList'
import PrinterList from './components/PrinterList'
import ProductList from './components/ProductList'
import ProductForm from './components/ProductForm'
import { Filament } from './types/filament'
import { PrintQueueItem, Printer } from './types/printer'
import { PurchaseListItem } from './types/purchase'
import { Part } from './types/part'
import { Product, ProductFormData, ProductWithCalculations } from './types/product'
import { API_URL } from './config'
import PartForm from './components/PartForm'
import Settings from './components/Settings'

function App() {
  const [filaments, setFilaments] = useState<Filament[]>([])
  const [printers, setPrinters] = useState<Printer[]>([])
  const [queueItems, setQueueItems] = useState<PrintQueueItem[]>([])
  const [purchaseItems, setPurchaseItems] = useState<PurchaseListItem[]>([])
  const [parts, setParts] = useState<Part[]>([])
  const [products, setProducts] = useState<ProductWithCalculations[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAddingFilament, setIsAddingFilament] = useState(false)
  const [isAddingPart, setIsAddingPart] = useState(false)
  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const [activeView, setActiveView] = useState<'filaments' | 'parts' | 'printers' | 'products' | 'settings'>('filaments')
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  
  const navigate = useNavigate()
  const location = useLocation()
  
  // Global settings for profit margin calculations
  interface Settings {
    spool_weight: number;
    filament_markup: number;
    hourly_rate: number;
    wear_tear_markup: number;
    platform_fees: number;
    filament_spool_price: number;
    desired_profit_margin: number;
    packaging_cost: number;
    [key: string]: number;
  }

  const [settings, setSettings] = useState<Settings>({
    spool_weight: 1000,
    filament_markup: 20,
    hourly_rate: 20,
    wear_tear_markup: 5,
    platform_fees: 7,
    filament_spool_price: 18,
    desired_profit_margin: 55,
    packaging_cost: 0.5
  })

  useEffect(() => {
    Promise.all([
      fetchFilaments(),
      fetchPrinters(),
      fetchPrintQueue(),
      fetchPurchaseItems(),
      fetchParts(),
      fetchProducts(),
      fetchSettings()
    ]).finally(() => setIsLoading(false))
  }, [])
  
  // Set active view based on URL path
  useEffect(() => {
    const path = location.pathname.slice(1) || 'filaments'
    if (['filaments', 'parts', 'printers', 'products', 'settings'].includes(path)) {
      setActiveView(path as 'filaments' | 'parts' | 'printers' | 'products' | 'settings')
      
      // Refetch data when route changes to ensure content updates
      if (path === 'filaments') fetchFilaments();
      if (path === 'parts') fetchParts();
      if (path === 'printers') fetchPrinters();
      if (path === 'products') fetchProducts();
      if (path === 'settings') fetchSettings();
    } else {
      navigate('/filaments')
    }
  }, [location.pathname, navigate])

  const fetchFilaments = async () => {
    try {
      const response = await fetch(`${API_URL}/api/filaments`)
      if (!response.ok) throw new Error('Failed to fetch filaments')
      const data = await response.json()
      setFilaments(data)
    } catch (err) {
      setError('Failed to load filaments')
    }
  }

  const fetchPrinters = async () => {
    try {
      const response = await fetch(`${API_URL}/api/printers`)
      if (!response.ok) throw new Error('Failed to fetch printers')
      const data = await response.json()
      setPrinters(data)
    } catch (err) {
      setError('Failed to load printers')
    }
  }

  const fetchPrintQueue = async () => {
    try {
      const response = await fetch(`${API_URL}/api/print-queue`)
      if (!response.ok) throw new Error('Failed to fetch print queue')
      const data = await response.json()
      setQueueItems(data)
    } catch (err) {
      setError('Failed to load print queue')
    }
  }

  const fetchPurchaseItems = async () => {
    try {
      const response = await fetch(`${API_URL}/api/purchase-list`)
      if (!response.ok) throw new Error('Failed to fetch purchase items')
      const data = await response.json()
      setPurchaseItems(data)
    } catch (err) {
      setError('Failed to load purchase list')
    }
  }

  const fetchParts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/parts`)
      if (!response.ok) throw new Error('Failed to fetch parts')
      const data = await response.json()
      setParts(data)
    } catch (err) {
      setError('Failed to load parts')
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/products`)
      if (!response.ok) throw new Error('Failed to fetch products')
      const data = await response.json()
      
      // Calculate profit margins for each product
      const productsWithCalculations = data.map((product: Product) => {
        // Ensure filaments property exists even if it's not in the API response
        if (!product.filaments) {
          product.filaments = [];
        }
        return calculateProductMargins(product)
      })
      
      setProducts(productsWithCalculations)
    } catch (err) {
      setError('Failed to load products')
    }
  }
  
  const calculateProductMargins = (product: Product): ProductWithCalculations => {
    // Calculate labor cost
    const totalMinutes = product.print_prep_time + product.post_processing_time
    const laborCost = (totalMinutes / 60) * settings.hourly_rate
    
    // Calculate total filament used and cost from individual filament amounts and costs
    let totalFilamentUsed = 0;
    let totalFilamentCost = 0;
    
    if (product.filaments && product.filaments.length > 0) {
      product.filaments.forEach(filament => {
        const amount = filament.filament_usage_amount || 0;
        // Use individual filament cost if set, otherwise fall back to global price
        const cost = filament.cost || settings.filament_spool_price;
        totalFilamentUsed += amount;
        totalFilamentCost += (amount / 1000) * cost; // Convert grams to kg for cost calculation
      });
    } else {
      // Fallback to using the global filament price if no filaments are set
      totalFilamentUsed = product.filament_used;
      totalFilamentCost = (product.filament_used / 1000) * settings.filament_spool_price;
    }
    
    // Calculate wear and tear cost
    const wearTearCost = totalFilamentCost * (settings.wear_tear_markup / 100)
    
    // Calculate total cost (now including additional parts cost and packaging cost)
    const totalCost = laborCost + totalFilamentCost + wearTearCost + product.additional_parts_cost + settings.packaging_cost
    
    // Calculate suggested price based on desired profit margin
    const platformFeePercent = settings.platform_fees / 100
    const desiredMarginDecimal = settings.desired_profit_margin / 100
    const suggestedPrice = totalCost / (1 - desiredMarginDecimal - platformFeePercent)
    
    // Use list_price if set, otherwise use suggested price based on profit margin
    const sellingPrice = product.list_price > 0 
      ? product.list_price 
      : suggestedPrice;
    
    // Calculate platform fees
    const platformFeeAmount = sellingPrice * (settings.platform_fees / 100)
    
    // Calculate gross profit
    const grossProfit = sellingPrice - totalCost - platformFeeAmount
    
    // Calculate profit margin
    const profitMargin = sellingPrice > 0 ? (grossProfit / sellingPrice) * 100 : 0
    
    return {
      ...product,
      filament_used: totalFilamentUsed,
      labor_cost: laborCost,
      filament_cost: totalFilamentCost,
      wear_tear_cost: wearTearCost,
      total_cost: totalCost,
      selling_price: sellingPrice,
      platform_fee_amount: platformFeeAmount,
      gross_profit: grossProfit,
      profit_margin: profitMargin,
      suggested_price: suggestedPrice
    }
  }

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API_URL}/api/settings?t=${Date.now()}`)
      if (!response.ok) throw new Error('Failed to fetch settings')
      const data = await response.json()
      // Convert string values to numbers
      const numericSettings = Object.entries(data).reduce((acc, [key, value]) => {
        acc[key] = parseFloat(value as string) || 0
        return acc
      }, {} as typeof settings)
      setSettings(numericSettings)
    } catch (err) {
      setError('Failed to load settings')
    }
  }

  const updateSettings = async (newSettings: typeof settings) => {
    try {
      // Convert numbers to strings for API, preserving zero values
      const stringSettings = Object.entries(newSettings).reduce((acc, [key, value]) => {
        acc[key] = value === 0 ? '0' : value.toString()
        return acc
      }, {} as Record<string, string>)
      
      const response = await fetch(`${API_URL}/api/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(stringSettings)
      })
      if (!response.ok) throw new Error('Failed to update settings')
      const data = await response.json()
      
      // Convert string values back to numbers, preserving zero values
      const numericSettings = Object.entries(data).reduce((acc, [key, value]) => {
        const numValue = parseFloat(value as string)
        acc[key] = isNaN(numValue) ? 0 : numValue
        return acc
      }, {} as typeof settings)
      
      setSettings(numericSettings)
      
      // Recalculate product margins with the new settings
      const updatedProducts = products.map(product => calculateProductMargins(product))
      setProducts(updatedProducts)
    } catch (err) {
      setError('Failed to update settings')
    }
  }

  const handleAddFilament = async (filament: Filament) => {
    try {
      const response = await fetch(`${API_URL}/api/filaments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filament)
      })
      if (!response.ok) throw new Error('Failed to add filament')
      await fetchFilaments()
      setIsAddingFilament(false)
      setError(null)
    } catch (err) {
      setError('Failed to add filament')
    }
  }

  const handleUpdateFilament = async (filament: Filament) => {
    try {
      const response = await fetch(`${API_URL}/api/filaments/${filament.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filament)
      })
      if (!response.ok) throw new Error('Failed to update filament')
      await fetchFilaments()
      // Recalculate product margins with the updated filament costs
      const updatedProducts = products.map(product => calculateProductMargins(product))
      setProducts(updatedProducts)
      setError(null)
    } catch (err) {
      setError('Failed to update filament')
    }
  }

  const handleDeleteFilament = async (id: number) => {
    if (!confirm('Are you sure you want to delete this filament?')) return
    
    try {
      const response = await fetch(`${API_URL}/api/filaments/${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete filament')
      await fetchFilaments()
      setError(null)
    } catch (err) {
      setError('Failed to delete filament')
    }
  }

  const handleAddQueueItem = async (item: PrintQueueItem) => {
    try {
      const response = await fetch(`${API_URL}/api/print-queue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      })
      if (!response.ok) throw new Error('Failed to add queue item')
      await fetchPrintQueue()
      setError(null)
    } catch (err) {
      setError('Failed to add queue item')
    }
  }

  const handleUpdateQueueItem = async (item: PrintQueueItem) => {
    try {
      const response = await fetch(`${API_URL}/api/print-queue/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      })
      if (!response.ok) throw new Error('Failed to update queue item')
      await fetchPrintQueue()
      setError(null)
    } catch (err) {
      setError('Failed to update queue item')
    }
  }

  const handleDeleteQueueItem = async (id: number) => {
    if (!confirm('Are you sure you want to delete this queue item?')) return
    
    try {
      const response = await fetch(`${API_URL}/api/print-queue/${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete queue item')
      await fetchPrintQueue()
      setError(null)
    } catch (err) {
      setError('Failed to delete queue item')
    }
  }

  const handleReorderQueueItems = async (items: PrintQueueItem[]) => {
    try {
      const response = await fetch(`${API_URL}/api/print-queue/reorder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ items })
      })
      
      if (!response.ok) throw new Error('Failed to reorder queue items')
      const data = await response.json()
      setQueueItems(data)
    } catch (err) {
      setError('Failed to reorder queue items')
      // Fallback to original order via refetch
      fetchPrintQueue()
    }
  }

  const handleAddPurchaseItem = async (item: PurchaseListItem) => {
    try {
      const response = await fetch(`${API_URL}/api/purchase-list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      })
      if (!response.ok) throw new Error('Failed to add purchase item')
      await fetchPurchaseItems()
      setError(null)
    } catch (err) {
      setError('Failed to add purchase item')
    }
  }

  const handleUpdatePurchaseItem = (item: PurchaseListItem) => {
    setPurchaseItems(items => items.map(i => i.id === item.id ? item : i));
    setError(null);
  };

  const handleDeletePurchaseItem = async (id: number) => {
    if (!confirm('Are you sure you want to delete this purchase item?')) return
    
    try {
      const response = await fetch(`${API_URL}/api/purchase-list/${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete purchase item')
      await fetchPurchaseItems()
      setError(null)
    } catch (err) {
      setError('Failed to delete purchase item')
    }
  }

  const handleAddPart = async (part: Part) => {
    try {
      const response = await fetch(`${API_URL}/api/parts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(part)
      })
      if (!response.ok) throw new Error('Failed to add part')
      await fetchParts()
      setError(null)
    } catch (err) {
      setError('Failed to add part')
    }
  }

  const handleUpdatePart = async (part: Part) => {
    try {
      const response = await fetch(`${API_URL}/api/parts/${part.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(part)
      })
      if (!response.ok) throw new Error('Failed to update part')
      await fetchParts()
      setError(null)
    } catch (err) {
      setError('Failed to update part')
    }
  }

  const handleDeletePart = async (id: number) => {
    if (!confirm('Are you sure you want to delete this part?')) return
    
    try {
      const response = await fetch(`${API_URL}/api/parts/${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete part')
      await fetchParts()
      setError(null)
    } catch (err) {
      setError('Failed to delete part')
    }
  }

  const handleAddPrinter = async () => {
    try {
      await fetchPrinters();
    } catch (err) {
      setError('Failed to refresh printers');
    }
  }

  const handleUpdatePrinter = async () => {
    try {
      await fetchPrinters();
    } catch (err) {
      setError('Failed to refresh printers');
    }
  }

  const handleDeletePrinter = async () => {
    try {
      await fetchPrinters();
    } catch (err) {
      setError('Failed to refresh printers');
    }
  }

  const handleAddProduct = async (product: Product | ProductFormData) => {
    try {
      // Extract filaments from the product data
      const filaments = 'filaments' in product ? product.filaments || [] : [];
      
      // Create the product without filaments first
      const response = await fetch(`${API_URL}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: product.name,
          business: product.business,
          filament_used: product.filament_used,
          print_prep_time: product.print_prep_time,
          post_processing_time: product.post_processing_time,
          additional_parts_cost: product.additional_parts_cost,
          list_price: product.list_price,
          notes: product.notes || ''
        })
      })
      
      if (!response.ok) throw new Error('Failed to add product')
      
      // Get the newly created product ID
      const newProduct = await response.json();
      
      // Associate filaments if any were selected
      if (filaments.length > 0 && newProduct.id) {
        for (const filament of filaments) {
          if (filament.id) {
            // First add the filament association
            await fetch(`${API_URL}/api/products/${newProduct.id}/filaments`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ filament_id: filament.id })
            });

            // Then update the usage amount if specified
            if (filament.filament_usage_amount !== undefined) {
              await fetch(`${API_URL}/api/products/${newProduct.id}/filaments/${filament.id}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ filament_usage_amount: filament.filament_usage_amount })
              });
            }
          }
        }
      }
      
      // Add filaments to the new product object
      const completeNewProduct = {
        ...newProduct,
        filaments: filaments
      };
      
      // Calculate margins and add to the products array
      const productWithCalculations = calculateProductMargins(completeNewProduct);
      setProducts([...products, productWithCalculations]);
      
      setIsAddingProduct(false)
    } catch (err) {
      setError('Failed to add product')
      await fetchProducts() // Fallback to full refresh if adding fails
    }
  }
  
  const handleUpdateProduct = async (product: Product | ProductFormData) => {
    const productId = 'id' in product ? product.id : editingProduct?.id;
    if (!productId) return;

    const productWithId = {
      ...product,
      id: productId,
      filament_used: product.filament_used || 0, // Ensure filament_used is always defined
      notes: product.notes || '' // Ensure notes is always defined
    };

    try {
      const response = await fetch(`${API_URL}/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productWithId),
      });

      if (!response.ok) {
        throw new Error('Failed to update product');
      }

      const updatedProduct = await response.json();
      setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p));
      setEditingProduct(null);
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };
  
  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    
    try {
      const response = await fetch(`${API_URL}/api/products/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete product')
      
      // Filter out the deleted product from state
      setProducts(products.filter(product => product.id !== id))
    } catch (err) {
      setError('Failed to delete product')
      await fetchProducts() // Fallback to full refresh if delete fails
    }
  }

  // Recalculate product margins when settings change
  useEffect(() => {
    if (products.length > 0) {
      const updatedProducts = products.map(product => calculateProductMargins(product))
      setProducts(updatedProducts)
    }
  }, [
    settings.hourly_rate, 
    settings.wear_tear_markup, 
    settings.platform_fees, 
    settings.filament_spool_price, 
    settings.desired_profit_margin,
    settings.packaging_cost
  ])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white p-8 font-mono">
        <div className="text-black text-sm">INITIALIZING SIMS...</div>
      </div>
    )
  }

  // Handle rendering the appropriate view component
  const renderActiveView = () => {
    switch (activeView) {
      case 'filaments':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-3">
              <FilamentList
                filaments={filaments}
                onUpdate={handleUpdateFilament}
                onDelete={handleDeleteFilament}
              />
            </div>
            <div>
              <PrintQueue
                items={queueItems}
                printers={printers}
                onAdd={handleAddQueueItem}
                onUpdate={handleUpdateQueueItem}
                onDelete={handleDeleteQueueItem}
                onReorder={handleReorderQueueItems}
              />
              <div className="mt-4">
                <PurchaseList
                  items={purchaseItems}
                  filaments={filaments}
                  onAdd={handleAddPurchaseItem}
                  onUpdate={handleUpdatePurchaseItem}
                  onDelete={handleDeletePurchaseItem}
                />
              </div>
            </div>
          </div>
        );
      
      case 'parts':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-3">
              <PartList
                parts={parts}
                printers={printers.filter(p => p.id !== undefined) as { id: number; name: string }[]}
                onUpdatePart={handleUpdatePart}
                onDeletePart={handleDeletePart}
              />
            </div>
          </div>
        );
      
      case 'printers':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-3">
              <PrinterList
                printers={printers}
                onUpdate={handleUpdatePrinter}
                onDelete={handleDeletePrinter}
                onAdd={handleAddPrinter}
              />
            </div>
          </div>
        );
      
      case 'products':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-4">
              <div className="flex flex-col space-y-4">
                <ProductList
                  products={products}
                  onUpdate={handleUpdateProduct}
                  onDelete={handleDeleteProduct}
                  hourlyRate={settings.hourly_rate}
                  wearTearPercentage={settings.wear_tear_markup}
                  platformFees={settings.platform_fees}
                  filamentSpoolPrice={settings.filament_spool_price}
                  desiredProfitMargin={settings.desired_profit_margin}
                  packagingCost={settings.packaging_cost}
                  onUpdateSettings={updateSettings}
                />
              </div>
            </div>
          </div>
        );
      
      case 'settings':
        return (
          <div className="border-2 border-black">
            <Settings 
              settings={settings} 
              onUpdateSettings={updateSettings} 
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white sm:p-8 font-mono">
      <div className="w-full">
        <div className="flex flex-col space-y-0 sm:space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-black border-2 border-black p-4 space-y-4 sm:space-y-0">
            <div className="w-1/4">
              <div className="flex flex-col sm:flex-row sm:items-baseline space-y-2 sm:space-y-0 sm:space-x-4">
                <h1 className="text-2xl font-medium tracking-wider text-white">SIMS TERMINAL v1.0</h1>
              </div>
            </div>
            <div className="flex justify-center w-1/2">
              <div className="flex space-x-2">
                <Link
                  to="/filaments"
                  onClick={() => setActiveView('filaments')}
                  className={`w-auto px-4 py-2 border border-black rounded-none text-xs font-bold text-white ${activeView === 'filaments' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'} focus:outline-none focus:ring-1 focus:ring-black transition-colors uppercase tracking-wider`}
                >
                  FILAMENTS
                </Link>
                <Link
                  to="/parts"
                  onClick={() => setActiveView('parts')}
                  className={`w-auto px-4 py-2 border border-black rounded-none text-xs font-bold text-white ${activeView === 'parts' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'} focus:outline-none focus:ring-1 focus:ring-black transition-colors uppercase tracking-wider`}
                >
                  PARTS
                </Link>
                <Link
                  to="/printers"
                  onClick={() => setActiveView('printers')}
                  className={`w-auto px-4 py-2 border border-black rounded-none text-xs font-bold text-white ${activeView === 'printers' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'} focus:outline-none focus:ring-1 focus:ring-black transition-colors uppercase tracking-wider`}
                >
                  PRINTERS
                </Link>
                <Link
                  to="/products"
                  onClick={() => setActiveView('products')}
                  className={`w-auto px-4 py-2 border border-black rounded-none text-xs font-bold text-white ${activeView === 'products' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'} focus:outline-none focus:ring-1 focus:ring-black transition-colors uppercase tracking-wider`}
                >
                  PRODUCTS
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setActiveView('settings')}
                  className={`w-auto px-4 py-2 border border-black rounded-none text-xs font-bold text-white ${activeView === 'settings' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'} focus:outline-none focus:ring-1 focus:ring-black transition-colors uppercase tracking-wider`}
                >
                  SETTINGS
                </Link>
              </div>
            </div>
            <div className="w-1/4 flex justify-end">
              <div className="flex space-x-2">
                {activeView !== 'printers' && activeView !== 'settings' && (
                  <button
                    onClick={() => {
                      if (activeView === 'parts') setIsAddingPart(true)
                      else if (activeView === 'filaments') setIsAddingFilament(true)
                      else if (activeView === 'products') setIsAddingProduct(true)
                    }}
                    className="w-full sm:w-auto px-4 py-2 border border-black rounded-none text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-1 focus:ring-black transition-colors uppercase tracking-wider"
                  >
                    NEW {activeView === 'parts' ? 'PART' : activeView === 'products' ? 'PRODUCT' : 'RECORD'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 border-2 border-black bg-white text-black">
              <div className="text-xs font-medium uppercase tracking-wider mb-1">SIMS ERROR</div>
              <div className="text-sm">{error}</div>
            </div>
          )}

          {isAddingFilament && activeView === 'filaments' && (
            <FilamentForm
              isOpen={isAddingFilament}
              onSubmit={handleAddFilament}
              onClose={() => setIsAddingFilament(false)}
            />
          )}

          {isAddingPart && activeView === 'parts' && (
            <PartForm
              isOpen={isAddingPart}
              printers={printers.filter(p => p.id !== undefined) as { id: number; name: string }[]}
              onSubmit={handleAddPart}
              onClose={() => setIsAddingPart(false)}
            />
          )}

          {isAddingProduct && activeView === 'products' && (
            <ProductForm
              product={null}
              isOpen={isAddingProduct}
              onSubmit={handleAddProduct}
              onClose={() => setIsAddingProduct(false)}
              hourlyRate={settings.hourly_rate}
              wearTearPercentage={settings.wear_tear_markup}
              platformFees={settings.platform_fees}
              filamentSpoolPrice={settings.filament_spool_price}
              desiredProfitMargin={settings.desired_profit_margin}
              packagingCost={settings.packaging_cost}
            />
          )}

          {editingProduct && (
            <ProductForm
              product={editingProduct}
              isOpen={!!editingProduct}
              onSubmit={handleUpdateProduct}
              onClose={() => setEditingProduct(null)}
              hourlyRate={settings.hourly_rate}
              wearTearPercentage={settings.wear_tear_markup}
              platformFees={settings.platform_fees}
              filamentSpoolPrice={settings.filament_spool_price}
              desiredProfitMargin={settings.desired_profit_margin}
              packagingCost={settings.packaging_cost}
            />
          )}

          {/* Render the active view */}
          {renderActiveView()}
        </div>
      </div>
    </div>
  )
}

export default App