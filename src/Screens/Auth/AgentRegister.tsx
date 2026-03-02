import { useState } from 'react';
import { db, auth } from '../../firebase';
import { Box, TextField, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSnackBar } from '../../Components/NasnaSnackBar';
import { useTranslation } from 'react-i18next';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

interface AgentFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
  areaOfOperation: string;
  role: string;
}

function AgentRegister() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showSnackbar } = useSnackBar();

  const [formData, setFormData] = useState<AgentFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    areaOfOperation: '',
    role: 'agent',
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      showSnackbar('Passwords do not match.', 'error');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password,
      );

      const { password: _pw, confirmPassword: _cpw, ...dataToSave } = formData;

      await setDoc(doc(db, 'members', userCredential.user.uid), {
        uid: userCredential.user.uid,
        ...dataToSave,
        isAdmin: false,
        validated: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        consentGiven: true,
      });

      await signOut(auth);

      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phoneNumber: '',
        areaOfOperation: '',
        role: 'agent',
      });

      showSnackbar('Registration successful! Please log in.', 'success');
      navigate('/auth/login');
    } catch (error) {
      console.error('Error registering agent: ', error);
      showSnackbar('Error registering. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: '20px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        marginTop: '20px',
        marginBottom: '20px',
      }}
    >
      <Typography variant="h4" component="h1" gutterBottom>
        Become An Agent
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          label="Full Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          label="Password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          label="Phone Number"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          label="Area of Operation"
          name="areaOfOperation"
          value={formData.areaOfOperation}
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <Typography variant="body2" color="textSecondary">
          {t('home.consent')}
        </Typography>
        <Button type="submit" variant="contained" color="primary" fullWidth disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </Button>
      </form>
    </Box>
  );
}

export default AgentRegister;
