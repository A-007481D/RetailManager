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
	    description: string;
	    quantity: number;
	    prixUnitTTC: number;
	
	    static createFrom(source: any = {}) {
	        return new InvoiceItemRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.description = source["description"];
	        this.quantity = source["quantity"];
	        this.prixUnitTTC = source["prixUnitTTC"];
	    }
	}
	export class InvoiceCreateRequest {
	    date: string;
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
		    if (a.slice) {
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
	        this.description = source["description"];
	        this.quantity = source["quantity"];
	        this.prixUnitTTC = source["prixUnitTTC"];
	        this.totalTTC = source["totalTTC"];
	    }
	}
	
	export class InvoiceResponse {
	    id: number;
	    formattedId: string;
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
		    if (a.slice) {
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

