
import { isAuthenticated, isTokenExpired, parseTokenPayload } from "./auth";


describe('Auth Util - parseTokenPayload', () => {

    test('Deberia retornar si no hay token', () => {
        const token = null;
        
        const result = parseTokenPayload(token);

        expect(result).toBeFalsy();
    });

    test('Deberia retornar el token', () => {
        const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30";

        const result = parseTokenPayload(token);

        expect(result).not.toBeNull()
        
    })

    test('isAuthenticated queries the localstorage', () => {
        const token = "eyhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30";
        const localStorageMock = {
            getItem: vi.fn((key) => token),
            setItem: vi.fn((key) => console.log('Set ' + key)),
            removeItem: vi.fn((key) => console.log('remove ' + key))
        }

        Object.defineProperty(global, 'localStorage', {
            value: localStorageMock
        })

        const result = isAuthenticated();

        expect(result).not.toBe(null);
        expect(result).toBe(true);
        expect(localStorageMock.getItem).toHaveBeenCalled
    })
})