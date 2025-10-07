-- Ver el rol del usuario en users
SELECT id, email, role, full_name FROM users WHERE email = 'camiloalegriabarra@gmail.com';

-- Ver el rol del usuario en profiles
SELECT id, role, validation_status FROM profiles WHERE id = (
  SELECT id FROM users WHERE email = 'camiloalegriabarra@gmail.com'
);
