// server/src/services/mfaService.ts
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';

const generateMFASecret = async (userId) => {
  const secret = speakeasy.generateSecret({
    name: `YourApp (${userId})`,
  });

  const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

  return {
    secret: secret.base32,
    qrCodeUrl,
  };
};

export const verifyTOTP = (secret, token) => {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
  });
};

// server/src/routes/auth.ts
import express from 'express';
import { generateMFASecret, verifyTOTP } from './mfaService';
import { getUserById, updateUserMFA } from '../services/userService';

const router = express.Router();

router.post('/mfa/setup', async (req, res) => {
  const userId = req.user.id; // Assuming you have user data in the request
  const { secret, qrCodeUrl } = await generateMFASecret(userId);
  await updateUserMFA(userId, { secret, isEnabled: false });
  res.json({ qrCodeUrl });
});

router.post('/mfa/verify', async (req, res) => {
  const userId = req.user.id;
  const { token } = req.body;
  const user = await getUserById(userId);
  
  if (verifyTOTP(user.mfaSecret, token)) {
    await updateUserMFA(userId, { isEnabled: true });
    res.json({ success: true, message: 'MFA enabled successfully' });
  } else {
    res.status(400).json({ success: false, message: 'Invalid token' });
  }
});

router.post('/mfa/disable', async (req, res) => {
  const userId = req.user.id;
  const { token } = req.body;
  const user = await getUserById(userId);
  
  if (verifyTOTP(user.mfaSecret, token)) {
    await updateUserMFA(userId, { isEnabled: false, secret: null });
    res.json({ success: true, message: 'MFA disabled successfully' });
  } else {
    res.status(400).json({ success: false, message: 'Invalid token' });
  }
});

// client/src/components/MFASetup.tsx
import React, { useState } from 'react';
import { Button, Input } from '@/components/ui/';
import { setupMFA, verifyMFA } from '../api/auth';

const MFASetup = () => {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [token, setToken] = useState('');

  const handleSetup = async () => {
    const { qrCodeUrl } = await setupMFA();
    setQrCodeUrl(qrCodeUrl);
  };

  const handleVerify = async () => {
    const result = await verifyMFA(token);
    if (result.success) {
      alert('MFA enabled successfully');
    } else {
      alert('Invalid token');
    }
  };

  return (
    <div>
      <Button onClick={handleSetup}>Setup MFA</Button>
      {qrCodeUrl && <img src={qrCodeUrl} alt="MFA QR Code" />}
      <Input
        type="text"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="Enter MFA token"
      />
      <Button onClick={handleVerify}>Verify and Enable MFA</Button>
    </div>
  );
};

export default MFASetup;