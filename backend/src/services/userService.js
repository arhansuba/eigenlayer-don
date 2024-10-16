import { encrypt, decrypt } from '../utils/encryption';

export const saveUserSensitiveData = async (userId, data) => {
  const encryptedData = encrypt(data);
  await db.users.update({ id: userId }, { sensitiveData: encryptedData });
};

export const getUserSensitiveData = async (userId) => {
  const user = await db.users.findOne({ id: userId });
  if (user && user.sensitiveData) {
    return decrypt(user.sensitiveData);
  }
  return null;
};