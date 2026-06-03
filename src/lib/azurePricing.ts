// Azure Retail Prices API - ücretsiz, auth gerektirmez
const PRICING_API = 'https://prices.azure.com/api/retail/prices'

const regionMap: Record<string, string> = {
  'eastus': 'East US',
  'eastus2': 'East US 2',
  'westus': 'West US',
  'westus2': 'West US 2',
  'westeurope': 'West Europe',
  'northeurope': 'North Europe',
  'uksouth': 'UK South',
  'ukwest': 'UK West',
  'germanywestcentral': 'Germany West Central',
  'francecentral': 'France Central',
  'swedencentral': 'Sweden Central',
  'norwayeast': 'Norway East',
  'switzerlandnorth': 'Switzerland North',
  'australiaeast': 'Australia East',
  'southeastasia': 'Southeast Asia',
  'eastasia': 'East Asia',
  'japaneast': 'Japan East',
  'koreacentral': 'Korea Central',
  'centralindia': 'Central India',
  'brazilsouth': 'Brazil South',
  'canadacentral': 'Canada Central',
}

export async function getEstimatedCost(
  resourceType: string,
  location: string,
  _resourceName: string
): Promise<number> {
  try {
    const region = regionMap[location?.toLowerCase()] || location || 'East US'
    const type = resourceType?.toLowerCase() || ''

    // VM fiyatı
    if (type.includes('virtualmachines')) {
      return await getVMPrice(region)
    }

    // Disk fiyatı
    if (type.includes('disks')) {
      return await getDiskPrice(region)
    }

    // Storage fiyatı
    if (type.includes('storageaccounts')) {
      return await getStoragePrice(region)
    }

    // SQL Server fiyatı
    if (type.includes('sql')) {
      return await getSQLPrice(region)
    }

    // App Service fiyatı
    if (type.includes('sites') || type.includes('serverfarms')) {
      return await getAppServicePrice(region)
    }

    // Public IP fiyatı
    if (type.includes('publicipaddresses')) {
      return 3.65 // Sabit aylık fiyat ~$3.65
    }

    // Load Balancer
    if (type.includes('loadbalancers')) {
      return 18.25
    }

    // VNet Gateway
    if (type.includes('virtualnetworkgateways')) {
      return 27.38
    }

    // Genel tahmin
    return 15

  } catch {
    return 10 // Hata durumunda varsayılan
  }
}

async function getVMPrice(region: string): Promise<number> {
  try {
    const filter = `armRegionName eq '${regionToArm(region)}' and skuName eq 'D2s v3' and priceType eq 'Consumption' and serviceName eq 'Virtual Machines'`
    const url = `${PRICING_API}?$filter=${encodeURIComponent(filter)}`
    const res = await fetch(url)
    const data = await res.json()
    const price = data.Items?.[0]?.retailPrice || 0.096
    return Math.round(price * 730 * 100) / 100 // Saatlik → Aylık
  } catch {
    return 70 // D2s v3 yaklaşık aylık fiyat
  }
}

async function getDiskPrice(region: string): Promise<number> {
  try {
    const filter = `armRegionName eq '${regionToArm(region)}' and skuName eq 'P10' and priceType eq 'Consumption' and serviceName eq 'Storage'`
    const url = `${PRICING_API}?$filter=${encodeURIComponent(filter)}`
    const res = await fetch(url)
    const data = await res.json()
    return data.Items?.[0]?.retailPrice || 19.71
  } catch {
    return 19.71
  }
}

async function getStoragePrice(region: string): Promise<number> {
  try {
    const filter = `armRegionName eq '${regionToArm(region)}' and skuName eq 'LRS' and priceType eq 'Consumption' and serviceName eq 'Storage'`
    const url = `${PRICING_API}?$filter=${encodeURIComponent(filter)}`
    const res = await fetch(url)
    const data = await res.json()
    const pricePerGb = data.Items?.[0]?.retailPrice || 0.018
    return Math.round(pricePerGb * 100 * 100) / 100 // 100 GB varsayım
  } catch {
    return 1.8
  }
}

async function getSQLPrice(region: string): Promise<number> {
  try {
    const filter = `armRegionName eq '${regionToArm(region)}' and skuName eq '2 vCores' and priceType eq 'Consumption' and serviceName eq 'SQL Database'`
    const url = `${PRICING_API}?$filter=${encodeURIComponent(filter)}`
    const res = await fetch(url)
    const data = await res.json()
    const price = data.Items?.[0]?.retailPrice || 0.2014
    return Math.round(price * 730 * 100) / 100
  } catch {
    return 147
  }
}

async function getAppServicePrice(region: string): Promise<number> {
  try {
    const filter = `armRegionName eq '${regionToArm(region)}' and skuName eq 'B1' and priceType eq 'Consumption' and serviceName eq 'Azure App Service'`
    const url = `${PRICING_API}?$filter=${encodeURIComponent(filter)}`
    const res = await fetch(url)
    const data = await res.json()
    const price = data.Items?.[0]?.retailPrice || 0.018
    return Math.round(price * 730 * 100) / 100
  } catch {
    return 13.14
  }
}

function regionToArm(region: string): string {
  const map: Record<string, string> = {
    'East US': 'eastus',
    'East US 2': 'eastus2',
    'West US': 'westus',
    'West US 2': 'westus2',
    'West Europe': 'westeurope',
    'North Europe': 'northeurope',
    'UK South': 'uksouth',
    'Germany West Central': 'germanywestcentral',
    'France Central': 'francecentral',
  }
  return map[region] || region.toLowerCase().replace(/\s/g, '')
}

// Tüm kaynaklar için toplu fiyat hesapla
export async function calculateEstimatedCosts(
  resources: { id: string; resource_type: string; location: string; name: string }[]
): Promise<Record<string, number>> {
  const costMap: Record<string, number> = {}

  // Paralel fiyat hesapla (max 10 aynı anda)
  const batchSize = 10
  for (let i = 0; i < resources.length; i += batchSize) {
    const batch = resources.slice(i, i + batchSize)
    await Promise.all(
      batch.map(async (resource) => {
        const cost = await getEstimatedCost(
          resource.resource_type,
          resource.location,
          resource.name
        )
        costMap[resource.id] = cost
      })
    )
  }

  return costMap
}