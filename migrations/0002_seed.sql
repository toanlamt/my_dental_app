-- Demo accounts for local development. Password for all three: ChangeMe123!
-- Change or remove these before deploying to a real environment.

INSERT INTO users (id, email, password_hash, name, role) VALUES
  ('00000000-0000-4000-8000-000000000001', 'admin@clinic.local', 'pbkdf2$100000$b177d20dd38bb74d2f7e5263e6ebe994$b7acc496e43f282266fb1bd42e1e44b6c558682308fc964585c1db28e935d9b8', 'Clinic Admin', 'admin'),
  ('00000000-0000-4000-8000-000000000002', 'hongnhung2504@clinic.local', 'pbkdf2$100000$45c3653a7d793a615570f23164994793$9b903bbb2af763c7d31c1888a2f3ba2de643378268b5b45340e752a836517ff2', 'Dr. Hong Nhung', 'doctor'),
  ('00000000-0000-4000-8000-000000000003', 'staff@clinic.local', 'pbkdf2$100000$143d32664d0bfee5d812cdb278149f26$ed32233e7e242a7d31c1888a2f3ba2de643378268b5b45340e752a836517ff2', 'Front Desk Staff', 'staff');
