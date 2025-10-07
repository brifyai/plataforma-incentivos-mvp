-- Ver qué tablas existen
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Ver el rol del usuario
SELECT * FROM users WHERE email = 'camiloalegriabarra@gmail.com';

-- Ver si existe alguna tabla de perfiles
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%profile%';
