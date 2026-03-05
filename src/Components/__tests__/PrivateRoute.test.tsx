import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PrivateRoute from '../PrivateRoute';

const mockOnAuthStateChanged = jest.fn();
const mockSignOut = jest.fn();
const mockGetDoc = jest.fn();
const mockDoc = jest.fn();
const mockUseIdleTimeout = jest.fn();

jest.mock('../../firebase', () => ({
  auth: {},
  db: {},
}));

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: (...args: unknown[]) => mockOnAuthStateChanged(...args),
  signOut: (...args: unknown[]) => mockSignOut(...args),
}));

jest.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => mockDoc(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
}));

jest.mock('../../hooks/useIdleTimeout', () => ({
  useIdleTimeout: () => mockUseIdleTimeout(),
}));

function renderRoute(route: React.ReactElement) {
  return render(
    <MemoryRouter
      initialEntries={['/private']}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/" element={<div>home</div>} />
        <Route path="/auth/login" element={<div>login</div>} />
        <Route path="/private" element={route} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('PrivateRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.cookie = 'nasna_session=1';
    mockDoc.mockReturnValue({});
    mockGetDoc.mockResolvedValue({
      exists: () => false,
      data: () => null,
    });
  });

  it('redirects unauthenticated users to login', async () => {
    mockOnAuthStateChanged.mockImplementation((_auth, callback) => {
      void callback(null);
      return jest.fn();
    });

    renderRoute(
      <PrivateRoute>
        <div>protected</div>
      </PrivateRoute>,
    );

    await waitFor(() => {
      expect(screen.getByText('login')).toBeInTheDocument();
    });
  });

  it('redirects users without an allowed role', async () => {
    mockOnAuthStateChanged.mockImplementation((_auth, callback) => {
      void callback({
        uid: 'user-1',
        getIdTokenResult: jest.fn().mockResolvedValue({ claims: { role: 'agent' } }),
      });
      return jest.fn();
    });

    renderRoute(
      <PrivateRoute allowedRoles={['member']}>
        <div>protected</div>
      </PrivateRoute>,
    );

    await waitFor(() => {
      expect(screen.getByText('home')).toBeInTheDocument();
    });
  });

  it('blocks unvalidated member access when validation is required', async () => {
    mockOnAuthStateChanged.mockImplementation((_auth, callback) => {
      void callback({
        uid: 'user-2',
        getIdTokenResult: jest.fn().mockResolvedValue({ claims: { role: 'member' } }),
      });
      return jest.fn();
    });
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ validated: false }),
    });

    renderRoute(
      <PrivateRoute allowedRoles={['member']} requireValidated>
        <div>protected</div>
      </PrivateRoute>,
    );

    await waitFor(() => {
      expect(screen.getByText(/your account is being verified/i)).toBeInTheDocument();
    });
  });

  it('renders protected content for validated allowed roles', async () => {
    mockOnAuthStateChanged.mockImplementation((_auth, callback) => {
      void callback({
        uid: 'user-3',
        getIdTokenResult: jest.fn().mockResolvedValue({ claims: { role: 'member' } }),
      });
      return jest.fn();
    });
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ validated: true }),
    });

    renderRoute(
      <PrivateRoute allowedRoles={['member']} requireValidated>
        <div>protected</div>
      </PrivateRoute>,
    );

    await waitFor(() => {
      expect(screen.getByText('protected')).toBeInTheDocument();
    });
  });
});
