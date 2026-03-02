import { useState } from 'react';
import { Box, TextField, Button, FormControlLabel, Checkbox, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSnackBar } from '../../Components/NasnaSnackBar';
import { useTranslation } from 'react-i18next';
import { db, auth } from '../../firebase';
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

interface RegisterFormData {
  name: string;
  contactPersonName: string;
  email: string;
  phoneNumber: string;
  areaOfOperation: string;
  kindOfHelp: string;
  initiativeOrNgo: string;
  role: string;
  numberOfVolunteers: string;
  isOfficiallyRegistered: boolean;
  consentGiven: boolean;
}

function Register() {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackBar();
  const { t } = useTranslation();

  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    contactPersonName: '',
    email: '',
    phoneNumber: '',
    areaOfOperation: '',
    kindOfHelp: '',
    initiativeOrNgo: '',
    role: 'member',
    numberOfVolunteers: '',
    isOfficiallyRegistered: false,
    consentGiven: false,
  });

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.consentGiven) {
      showSnackbar(t('register.toast.consentRequired'), 'error');
      return;
    }

    if (password !== confirmPassword) {
      showSnackbar(t('register.toast.passwordMismatch'), 'error');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, password);

      await sendEmailVerification(userCredential.user);

      await setDoc(doc(db, 'members', userCredential.user.uid), {
        uid: userCredential.user.uid,
        ...formData,
        isAdmin: false,
        validated: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await signOut(auth);
      setFormData({
        name: '',
        contactPersonName: '',
        email: '',
        phoneNumber: '',
        areaOfOperation: '',
        kindOfHelp: '',
        initiativeOrNgo: '',
        role: 'member',
        numberOfVolunteers: '',
        isOfficiallyRegistered: false,
        consentGiven: false,
      });
      setPassword('');
      setConfirmPassword('');

      showSnackbar(t('register.toast.success'), 'success');
      navigate('/auth/login');
    } catch (error) {
      console.error('Error registering NGO: ', error);
      showSnackbar(t('register.toast.error'), 'error');
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
        {t('register.title')}
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          label={t('register.fields.name')}
          name="name"
          value={formData.name}
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          label={t('register.fields.contactPersonName')}
          name="contactPersonName"
          value={formData.contactPersonName}
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          label={t('register.fields.email')}
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          label={t('register.fields.password')}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          label={t('register.fields.confirmPassword')}
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          label={t('register.fields.phoneNumber')}
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        />

        <FormControlLabel
          control={
            <Checkbox
              name="consentGiven"
              checked={formData.consentGiven}
              onChange={handleCheckboxChange}
              required
            />
          }
          label={t('register.consent')}
          sx={{ mb: 2 }}
        />
        <Button type="submit" variant="contained" color="primary" fullWidth disabled={loading}>
          {loading ? t('register.loading') : t('register.submit')}
        </Button>
      </form>
    </Box>
  );
}

export default Register;
