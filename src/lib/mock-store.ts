// Centralized in-memory store for no-database mode
// Using global to persist data across HMR reloads in development

export interface MockStore {
    suppliers: any[];
    products: any[];
}

const globalForMock = global as unknown as { mockStore: MockStore };

if (!globalForMock.mockStore) {
    globalForMock.mockStore = {
        suppliers: [
            {
                id: 'mock-supplier-1',
                userId: 'mock-user-1',
                name: 'Demo Supplier',
                companyName: 'Acme Corp',
                email: 'demo@acme.com',
                phone: '123-456-7890',
                address: '123 Mock Lane',
                status: 'APPROVED',
                verified: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                _count: { products: 5 }
            }
        ],
        products: []
    };
}

export const mockStore = globalForMock.mockStore;
