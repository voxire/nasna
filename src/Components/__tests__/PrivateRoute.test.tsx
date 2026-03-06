import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PrivateRoute from '../PrivateRoute';

const mockUseIdleTimeout = jest.fn();
const mockAuthState = {
  firebaseUser: null as unknown,
  profile: null as unknown,
  role: null as unknown,
  loading: false,
  initialized: true,
};

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../../hooks/useIdleTimeout', () => ({
  useIdleTimeout: () => mockUseIdleTimeout(),
}));

jest.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (state: typeof mockAuthState) => unknown) => selector(mockAuthState),
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
    mockAuthState.firebaseUser = null;
    mockAuthState.profile = null;
    mockAuthState.role = null;
    mockAuthState.loading = false;
    mockAuthState.initialized = true;
  });

  it('redirects unauthenticated users to login', async () => {
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
    mockAuthState.firebaseUser = { uid: 'user-1' };
    mockAuthState.role = 'agent';

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
    mockAuthState.firebaseUser = { uid: 'user-2' };
    mockAuthState.role = 'member';
    mockAuthState.profile = { validated: false };

    renderRoute(
      <PrivateRoute allowedRoles={['member']} requireValidated>
        <div>protected</div>
      </PrivateRoute>,
    );

    await waitFor(() => {
      expect(screen.getByText('auth.accountUnderReview')).toBeInTheDocument();
    });
  });

  it('renders protected content for validated allowed roles', async () => {
    mockAuthState.firebaseUser = { uid: 'user-3' };
    mockAuthState.role = 'member';
    mockAuthState.profile = { validated: true };

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
