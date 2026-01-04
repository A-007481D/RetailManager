export namespace client {
	
	export class Client {
	    ID: number;
	    // Go type: time
	    CreatedAt: any;
	    // Go type: time
	    UpdatedAt: any;
	    // Go type: gorm
	    DeletedAt: any;
	    name: string;
	    ice: string;
	    city: string;
	    address: string;
	    phone: string;
	    email: string;
	
	    static createFrom(source: any = {}) {
	        return new Client(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.CreatedAt = this.convertValues(source["CreatedAt"], null);
	        this.UpdatedAt = this.convertValues(source["UpdatedAt"], null);
	        this.DeletedAt = this.convertValues(source["DeletedAt"], null);
	        this.name = source["name"];
	        this.ice = source["ice"];
	        this.city = source["city"];
	        this.address = source["address"];
	        this.phone = source["phone"];
	        this.email = source["email"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace inventory {
	
	export class InventoryStats {
	    TotalProducts: number;
	    LowStockCount: number;
	
	    static createFrom(source: any = {}) {
	        return new InventoryStats(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.TotalProducts = source["TotalProducts"];
	        this.LowStockCount = source["LowStockCount"];
	    }
	}
	export class Product {
	    ID: number;
	    // Go type: time
	    CreatedAt: any;
	    // Go type: time
	    UpdatedAt: any;
	    // Go type: gorm
	    DeletedAt: any;
	    Reference: string;
	    Name: string;
	    Category: string;
	    BuyingPrice: number;
	    SellingPriceTTC: number;
	    CurrentStock: number;
	    MinStockLevel: number;
	
	    static createFrom(source: any = {}) {
	        return new Product(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.CreatedAt = this.convertValues(source["CreatedAt"], null);
	        this.UpdatedAt = this.convertValues(source["UpdatedAt"], null);
	        this.DeletedAt = this.convertValues(source["DeletedAt"], null);
	        this.Reference = source["Reference"];
	        this.Name = source["Name"];
	        this.Category = source["Category"];
	        this.BuyingPrice = source["BuyingPrice"];
	        this.SellingPriceTTC = source["SellingPriceTTC"];
	        this.CurrentStock = source["CurrentStock"];
	        this.MinStockLevel = source["MinStockLevel"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace invoice {
	
	export class ChequeInfo {
	    number: string;
	    bank: string;
	    city: string;
	    reference: string;
	
	    static createFrom(source: any = {}) {
	        return new ChequeInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.number = source["number"];
	        this.bank = source["bank"];
	        this.city = source["city"];
	        this.reference = source["reference"];
	    }
	}
	export class EffetInfo {
	    city: string;
	    dateEcheance: string;
	
	    static createFrom(source: any = {}) {
	        return new EffetInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.city = source["city"];
	        this.dateEcheance = source["dateEcheance"];
	    }
	}
	export class InvoiceItemRequest {
	    productId: number;
	    description: string;
	    quantity: number;
	    prixUnitTTC: number;
	
	    static createFrom(source: any = {}) {
	        return new InvoiceItemRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.productId = source["productId"];
	        this.description = source["description"];
	        this.quantity = source["quantity"];
	        this.prixUnitTTC = source["prixUnitTTC"];
	    }
	}
	export class InvoiceCreateRequest {
	    date: string;
	    customFormattedId: string;
	    clientName: string;
	    clientCity: string;
	    clientIce: string;
	    paymentMethod: string;
	    chequeInfo?: ChequeInfo;
	    effetInfo?: EffetInfo;
	    items: InvoiceItemRequest[];
	
	    static createFrom(source: any = {}) {
	        return new InvoiceCreateRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.date = source["date"];
	        this.customFormattedId = source["customFormattedId"];
	        this.clientName = source["clientName"];
	        this.clientCity = source["clientCity"];
	        this.clientIce = source["clientIce"];
	        this.paymentMethod = source["paymentMethod"];
	        this.chequeInfo = this.convertValues(source["chequeInfo"], ChequeInfo);
	        this.effetInfo = this.convertValues(source["effetInfo"], EffetInfo);
	        this.items = this.convertValues(source["items"], InvoiceItemRequest);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class InvoiceItem {
	    id: number;
	    invoiceId: number;
	    productId: number;
	    product: inventory.Product;
	    description: string;
	    quantity: number;
	    prixUnitTTC: number;
	    totalTTC: number;
	
	    static createFrom(source: any = {}) {
	        return new InvoiceItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.invoiceId = source["invoiceId"];
	        this.productId = source["productId"];
	        this.product = this.convertValues(source["product"], inventory.Product);
	        this.description = source["description"];
	        this.quantity = source["quantity"];
	        this.prixUnitTTC = source["prixUnitTTC"];
	        this.totalTTC = source["totalTTC"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class InvoiceResponse {
	    id: number;
	    formattedId: string;
	    customFormattedId: string;
	    date: string;
	    clientName: string;
	    clientCity: string;
	    clientIce: string;
	    totalHT: number;
	    totalTVA: number;
	    totalTTC: number;
	    totalInWords: string;
	    paymentMethod: string;
	    chequeInfo?: ChequeInfo;
	    effetInfo?: EffetInfo;
	    items: InvoiceItem[];
	
	    static createFrom(source: any = {}) {
	        return new InvoiceResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.formattedId = source["formattedId"];
	        this.customFormattedId = source["customFormattedId"];
	        this.date = source["date"];
	        this.clientName = source["clientName"];
	        this.clientCity = source["clientCity"];
	        this.clientIce = source["clientIce"];
	        this.totalHT = source["totalHT"];
	        this.totalTVA = source["totalTVA"];
	        this.totalTTC = source["totalTTC"];
	        this.totalInWords = source["totalInWords"];
	        this.paymentMethod = source["paymentMethod"];
	        this.chequeInfo = this.convertValues(source["chequeInfo"], ChequeInfo);
	        this.effetInfo = this.convertValues(source["effetInfo"], EffetInfo);
	        this.items = this.convertValues(source["items"], InvoiceItem);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class InvoiceStats {
	    TotalRevenue: number;
	    TotalInvoices: number;
	    RecentInvoices: InvoiceResponse[];
	
	    static createFrom(source: any = {}) {
	        return new InvoiceStats(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.TotalRevenue = source["TotalRevenue"];
	        this.TotalInvoices = source["TotalInvoices"];
	        this.RecentInvoices = this.convertValues(source["RecentInvoices"], InvoiceResponse);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace main {
	
	export class DashboardStats {
	    InvoiceStats?: invoice.InvoiceStats;
	    InventoryStats?: inventory.InventoryStats;
	
	    static createFrom(source: any = {}) {
	        return new DashboardStats(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.InvoiceStats = this.convertValues(source["InvoiceStats"], invoice.InvoiceStats);
	        this.InventoryStats = this.convertValues(source["InventoryStats"], inventory.InventoryStats);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

