SELECT u.email, u.role as user_role, p.role as profile_role, p.validation_status FROM users u LEFT JOIN profiles p ON u.id = p.id WHERE u.email = 'camiloalegriabarra@gmail.com';
