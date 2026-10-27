SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict Mlvim2OqaAwVbl843MNZReEDF2Fr4gb2wfnPZIjfH9zyZvGYkdRX8y0wQbDhWJg

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', 'e6d0fced-ac05-4bc7-bd3f-caaa78e3b7d0', 'authenticated', 'authenticated', 'admin@email.com', '$2a$10$bRFt0MzgorLedH7axBP2j.xU8RohUzdsEAR5fozdqxZCZt04/pdem', '2026-03-30 05:16:10.805344+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2026-03-30 05:16:10.789625+00', '2026-03-30 05:16:10.8068+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '110aac16-3e43-41ea-86f9-9a76fef0d1db', 'authenticated', 'authenticated', 'employee@email.com', '$2a$10$4gpE4cm6z8kkVJeX3oxxTOCBx9EvpNZxcsNRw4m9ltNaC3H/DaVa.', '2026-05-14 14:06:05.954292+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2026-05-14 14:06:05.927951+00', '2026-05-14 14:06:05.955266+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('e6d0fced-ac05-4bc7-bd3f-caaa78e3b7d0', 'e6d0fced-ac05-4bc7-bd3f-caaa78e3b7d0', '{"sub": "e6d0fced-ac05-4bc7-bd3f-caaa78e3b7d0", "email": "admin@email.com", "email_verified": false, "phone_verified": false}', 'email', '2026-03-30 05:16:10.797928+00', '2026-03-30 05:16:10.797979+00', '2026-03-30 05:16:10.797979+00', '44cd6c97-8473-4064-b62a-809a49d9a762'),
	('110aac16-3e43-41ea-86f9-9a76fef0d1db', '110aac16-3e43-41ea-86f9-9a76fef0d1db', '{"sub": "110aac16-3e43-41ea-86f9-9a76fef0d1db", "email": "employee@email.com", "email_verified": false, "phone_verified": false}', 'email', '2026-05-14 14:06:05.941555+00', '2026-05-14 14:06:05.941629+00', '2026-05-14 14:06:05.941629+00', '0113e89f-de8d-4ccf-918e-954b5e16951b');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_recovery_code_sets; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_recovery_codes; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: scim_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: scim_users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."categories" ("category_id", "name", "description", "image_url", "created_at") VALUES
	('a046054a-ee80-43c2-90a5-55714646fd51', 'Sản phẩm vệ sinh', 'sản phẩm vệ sinh', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Category-Image/categories/2026/4efeb2b6-d482-4629-9b7c-4bb0fb168ff6.png', '2026-04-24'),
	('4167d356-0ce9-403e-823b-59804680d0af', 'Gia dụng', 'Các sản phẩm liên quan đến Gia dụng.', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Category-Image/categories/2026/c098c9a5-1f68-4ce2-810c-d846b1bfcce9.png', '2026-04-23'),
	('c175ebce-c01a-445f-8f94-9fcd821ecf84', 'Bánh', 'Các sản phẩm liên quan đến Bánh.', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Category-Image/pastry.png', '2026-04-23'),
	('041f57c0-c546-4b8c-a94f-91acc9dc9fa6', 'Thức uống', 'Các sản phẩm liên quan đến Thức uống.', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Category-Image/drink.png', '2026-04-23'),
	('0f35d7bb-57cb-422a-9de8-1fb5e69393b5', 'Sữa', 'Các sản phẩm liên quan đến Sữa.', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Category-Image/milk.png', '2026-04-23'),
	('1bc3b5ef-af58-4e4a-a372-93b51810f894', 'Kẹo', 'Các sản phẩm liên quan đến Kẹo.', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Category-Image/candy.png', '2026-04-23'),
	('3a8d0d56-e5bb-4802-a2f3-b3f864047bfb', 'Rau củ', 'Các sản phẩm liên quan đến Rau củ.', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Category-Image/vegetable.png', '2026-04-23'),
	('438f7b13-66f0-4dfe-969c-406c3e3f5e8b', 'Mứt', 'Các sản phẩm liên quan đến Mứt.', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Category-Image/jam.png', '2026-04-23'),
	('480d80df-5809-45f4-822b-1ea538cc2eda', 'Đồ ngọt', 'Các sản phẩm liên quan đến Đồ ngọt.', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Category-Image/sweet.png', '2026-04-23'),
	('4e04d164-b2a0-45c8-9ec3-c186ac5636b2', 'Trà, Cà phê', 'Các sản phẩm liên quan đến Trà, Cà phê.', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Category-Image/tea.png', '2026-04-23'),
	('51a5b9d7-696e-410e-b986-a2a79c8a3d23', 'Dầu', 'Các sản phẩm liên quan đến Dầu.', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Category-Image/oil.png', '2026-04-23'),
	('85140a36-1583-4a97-a3c2-94cd6b3281e5', 'Gia Vị', 'Các sản phẩm liên quan đến Gia Vị.', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Category-Image/condiment.png', '2026-04-23'),
	('a5bf68d4-ec1b-4d2e-9888-1b0aaae78b3c', 'Thịt, cá', 'Các sản phẩm liên quan đến Thịt, cá.', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Category-Image/meat.png', '2026-04-23'),
	('a67e9162-7d36-44f1-a292-57c5d6e7046c', 'Hoa quả', 'Các sản phẩm liên quan đến Hoa quả.', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Category-Image/fruit.png', '2026-04-23'),
	('bb73fddf-fcae-45f8-b97b-6cf472db26c0', 'Sốt', 'Các sản phẩm liên quan đến Sốt.', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Category-Image/sauce.png', '2026-04-23'),
	('c372fc2b-33ab-4965-bac0-6242ce530c23', 'Xúc xích', 'Các sản phẩm liên quan đến Xúc xích.', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Category-Image/sausage.png', '2026-04-23'),
	('d8bedadf-a6fb-4078-a71a-a363c7903403', 'Ngũ Cốc', 'Các sản phẩm liên quan đến Ngũ cốc.', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Category-Image/cereal.png', '2026-04-23'),
	('d335bdcc-7010-48ed-a43b-b596a9b9070f', 'Thức uống có cồn', 'Các sản phẩm liên quan đến Thức uống có cồn.', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Category-Image/alcohol.png', '2026-04-23'),
	('748f9765-bb9e-46fc-af04-5c9fc5e26a26', 'Bún, mì, phở...', 'Các sản phẩm liên quan đến Bún, mì, phở.', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Category-Image/noodle.png', '2026-04-23');


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."products" ("product_id", "category_id", "name", "description", "unit", "image_url", "status", "created_at", "nutrition") VALUES
	('09db94d4-85b3-4dce-af65-430830ab0abd', 'a5bf68d4-ec1b-4d2e-9888-1b0aaae78b3c', 'Trứng gà công nghiệp', 'Trứng gà công nghiệp', '10 quả', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/trungga.png', 'active', '2026-04-08 13:30:56.1667+00', NULL),
	('aaaa0017-0000-0000-0000-000000000000', 'c175ebce-c01a-445f-8f94-9fcd821ecf84', 'Bánh quy bơ Danisa', 'Bánh quy bơ nhập khẩu Đan Mạch', 'Hộp', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/banhquybodanisa.png', 'active', '2026-04-09 10:02:56.515171+00', 'Năng lượng cao'),
	('aaaa0004-0000-0000-0000-000000000000', 'd335bdcc-7010-48ed-a43b-b596a9b9070f', 'Bia Heineken Silver', 'Bia lon 330ml', 'Lon', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/biaheinekein.png', 'active', '2026-04-09 10:02:56.515171+00', 'Cồn 4%'),
	('aaaa0014-0000-0000-0000-000000000000', '4e04d164-b2a0-45c8-9ec3-c186ac5636b2', 'Cà phê G7 3in1', 'Cà phê hòa tan Trung Nguyên', 'Hộp', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/caphe.png', 'active', '2026-04-09 10:02:56.515171+00', NULL),
	('aaaa0016-0000-0000-0000-000000000000', '3a8d0d56-e5bb-4802-a2f3-b3f864047bfb', 'Cải thìa thủy canh', 'Rau xanh trồng thủy canh sạch', 'Kg', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/caithie.png', 'active', '2026-04-09 10:02:56.515171+00', 'Nhiều chất xơ'),
	('aaaa0010-0000-0000-0000-000000000000', '51a5b9d7-696e-410e-b986-a2a79c8a3d23', 'Dầu ăn Simply 1L', 'Dầu đậu nành nguyên chất 100%', 'Chai', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/dauansimply.png', 'active', '2026-04-09 10:02:56.515171+00', 'Omega 3,6,9'),
	('aaaa0009-0000-0000-0000-000000000000', '748f9765-bb9e-46fc-af04-5c9fc5e26a26', 'Thùng mì Hảo Hảo tôm chua cay', 'Thùng 30 gói x 75g', 'Thùng', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/haohaothung.png', 'active', '2026-04-09 10:02:56.515171+00', NULL),
	('aaaa0001-0000-0000-0000-000000000000', '1bc3b5ef-af58-4e4a-a372-93b51810f894', 'Kẹo dừa Bến Tre', 'Kẹo dừa đặc sản Bến Tre vị nguyên bản', 'Gói', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/keodua.jfif', 'active', '2026-04-09 10:02:56.515171+00', 'Năng lượng: 400kcal/100g'),
	('aaaa0005-0000-0000-0000-000000000000', '041f57c0-c546-4b8c-a94f-91acc9dc9fa6', 'Nước khoáng LaVie 500ml', 'Nước khoáng thiên nhiên', 'Chai', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/lavie500ml.jpg', 'active', '2026-04-09 10:02:56.515171+00', 'Khoáng chất tự nhiên'),
	('aaaa0007-0000-0000-0000-000000000000', '438f7b13-66f0-4dfe-969c-406c3e3f5e8b', 'Mứt dâu tây Đà Lạt', 'Mứt dâu tây nguyên trái đặc sản', 'Hũ', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/mutdautaydalat.png', 'active', '2026-04-09 10:02:56.515171+00', 'Đường, Vitamin C'),
	('aaaa0003-0000-0000-0000-000000000000', '85140a36-1583-4a97-a3c2-94cd6b3281e5', 'Nước mắm Nam Ngư', 'Nước mắm cá cơm 3 in 1', 'Chai', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/nuocmamnamngu.png', 'active', '2026-04-09 10:02:56.515171+00', NULL),
	('aaaa0013-0000-0000-0000-000000000000', '480d80df-5809-45f4-822b-1ea538cc2eda', 'Socola đen Marou 75%', 'Socola thủ công Việt Nam', 'Thanh', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/socoladen.png', 'active', '2026-04-09 10:02:56.515171+00', 'Cacao nguyên chất'),
	('aaaa0018-0000-0000-0000-000000000000', '0f35d7bb-57cb-422a-9de8-1fb5e69393b5', 'Sữa tươi TH True Milk 1L', 'Sữa tươi tiệt trùng có đường', 'Hộp', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/suatuoi.png', 'active', '2026-04-09 10:02:56.515171+00', 'Canxi, Vitamin D3'),
	('aaaa0015-0000-0000-0000-000000000000', '4167d356-0ce9-403e-823b-59804680d0af', 'Nước rửa chén Sunlight', 'Hương chanh tự nhiên 3.6Kg', 'Can', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/sunlight.png', 'active', '2026-04-09 10:02:56.515171+00', NULL),
	('aaaa0006-0000-0000-0000-000000000000', 'a67e9162-7d36-44f1-a292-57c5d6e7046c', 'Táo Fuji Nam Phi', 'Táo nhập khẩu tươi ngon, giòn ngọt', 'Kg', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/taofuji.jpg', 'active', '2026-04-09 10:02:56.515171+00', 'Vitamin C, Kali'),
	('aaaa0008-0000-0000-0000-000000000000', 'a5bf68d4-ec1b-4d2e-9888-1b0aaae78b3c', 'Thịt ba chỉ heo sạch', 'Thịt heo đạt chuẩn VietGAP', 'Kg', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/thitbachiheo.png', 'active', '2026-04-09 10:02:56.515171+00', 'Protein, Lipid'),
	('aaaa0011-0000-0000-0000-000000000000', 'bb73fddf-fcae-45f8-b97b-6cf472db26c0', 'Tương ớt Chinsu 250g', 'Tương ớt cay nồng vị tỏi', 'Chai', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/tuongotchinsu.png', 'active', '2026-04-09 10:02:56.515171+00', NULL),
	('aaaa0012-0000-0000-0000-000000000000', 'c372fc2b-33ab-4965-bac0-6242ce530c23', 'Xúc xích Vissan', 'Xúc xích heo tiệt trùng', 'Gói', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/xucxichvissan.png', 'active', '2026-04-09 10:02:56.515171+00', 'Protein: 10g/100g'),
	('56d38f7d-3ee5-4edf-93e1-920f886ef6a7', 'a046054a-ee80-43c2-90a5-55714646fd51', 'Giấy vệ sinh Pulppy', 'Giấy vệ sinh Pulppy', 'Lốc', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/1296f22e-b989-44bd-8c1d-73ce57487705.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('aaaa0002-0000-0000-0000-000000000000', 'd8bedadf-a6fb-4078-a71a-a363c7903403', 'Yến mạch Quaker Oats', 'Yến mạch nguyên cám nhập khẩu', 'Hộp', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/yenmach.png', 'active', '2026-04-09 10:02:56.515171+00', 'Giàu chất xơ, Protein'),
	('ae8e6914-cb5d-4c75-bd7f-25ca37eab66f', 'a046054a-ee80-43c2-90a5-55714646fd51', 'Nước lau sàn Sunlight', 'Nước lau sàn Sunlight', 'Chai', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/9cd587a5-9cf9-4849-b580-f9b66e3edf7a.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('987aec87-9b1f-498a-ad11-8107f0e44761', 'a046054a-ee80-43c2-90a5-55714646fd51', 'Nước tẩy Vim', 'Nước tẩy Vim', 'Chai', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/21f454a7-65e5-47fd-a22e-f41f20dc4f2c.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('12b74edc-1962-41d9-a793-cf9d204fe0a5', 'a046054a-ee80-43c2-90a5-55714646fd51', 'Khăn giấy Tempo', 'Khăn giấy Tempo', 'Hộp', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/6cd25148-6243-4aaa-92b7-8201ecadc4dd.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('f0957403-2d3b-4d9b-9894-dee180cd297d', '4167d356-0ce9-403e-823b-59804680d0af', 'Màng bọc thực phẩm PE', 'Màng bọc thực phẩm PE', 'Cuộn', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/b97178ae-bb4d-4b0e-ad31-fa96d918634e.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('2c70d623-ed05-41cd-9fb8-d0ad1352699a', '4167d356-0ce9-403e-823b-59804680d0af', 'Miếng rửa chén Scotch-Brite', 'Miếng rửa chén Scotch-Brite', 'Gói', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/dd7773e6-fc71-4ac6-8e29-6b1f93a1ca29.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('1ec12119-d01c-4fb7-bf87-2c654982a056', 'c175ebce-c01a-445f-8f94-9fcd821ecf84', 'Bánh Chocopie Orion', 'Bánh Chocopie Orion', 'Hộp', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/69270ec5-d501-4ce1-9881-9c5d59ae7ac5.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('0871f6bf-ec18-4808-b20f-cbb3d6d4cd7f', 'c175ebce-c01a-445f-8f94-9fcd821ecf84', 'Bánh AFC vị rau', 'Bánh AFC vị rau', 'Hộp', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/b32c0551-e3de-4c43-af8f-bafd3d912ebe.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('3ffe74cc-2f16-4736-8ee5-facd79ba0fd5', 'c175ebce-c01a-445f-8f94-9fcd821ecf84', 'Bánh Pía Sóc Trăng', 'Bánh Pía Sóc Trăng', 'Hộp', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/3430372c-ee22-4a33-9bd7-a05314afd181.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('b7dffd36-d28a-400e-b719-0b74783569de', '041f57c0-c546-4b8c-a94f-91acc9dc9fa6', 'Nước cam Twister', 'Nước cam Twister', 'Chai', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/cc760d68-8d24-48b1-9974-a5af9a560a50.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('26bf6bec-ecd8-4a5a-a30b-fb7de3bca747', 'bb73fddf-fcae-45f8-b97b-6cf472db26c0', 'Tương cà Chinsu', 'Tương cà Chinsu', 'Chai', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/b2beb3fc-acec-496c-b9aa-90330154855b.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('62d661b4-1b03-4f14-837e-6bdfc78b2dd7', '041f57c0-c546-4b8c-a94f-91acc9dc9fa6', 'Sting Dâu', 'Sting Dâu', 'Lon', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/1efe488c-9628-4978-bc88-cc43f817323f.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('014d3c33-add9-4844-911a-8086bfea38f6', 'c372fc2b-33ab-4965-bac0-6242ce530c23', 'Xúc xích Đức Việt', 'Xúc xích Đức Việt', 'Gói', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/16280f80-6f27-49f2-950f-8ba7c3412cb1.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('41bc1a25-6a43-4daf-9bf3-f515550c5e9e', 'bb73fddf-fcae-45f8-b97b-6cf472db26c0', 'Sốt BBQ Lee Kum Kee', 'Sốt BBQ Lee Kum Kee', 'Chai', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/7798e4c2-5598-41cc-967e-95f3206ce3e9.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('06b97f7b-09a7-461d-a763-8bd2b30d4c4d', '0f35d7bb-57cb-422a-9de8-1fb5e69393b5', 'Sữa đặc Ông Thọ', 'Sữa đặc Ông Thọ', 'Lon', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/563e7c2d-202c-44b4-93ed-92e13d7e585a.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('ee332a56-b083-44eb-be61-177d6618f79d', '0f35d7bb-57cb-422a-9de8-1fb5e69393b5', 'Sữa đậu nành Fami', 'Sữa đậu nành Fami', 'Hộp', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/df3eed28-1c27-42ff-b1d5-8c6026c9d2f8.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('85c71bf7-df89-407c-9076-2f44bbad2133', '0f35d7bb-57cb-422a-9de8-1fb5e69393b5', 'Sữa hạt TH True Nut', 'Sữa hạt TH True Nut', 'Hộp', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/6bc12b9d-2857-451a-add2-10e97b33c6fc.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('a473f753-91c8-496b-b9e5-f77c23776aa6', '1bc3b5ef-af58-4e4a-a372-93b51810f894', 'Kẹo Mentos bạc hà', 'Kẹo Mentos bạc hà', 'Gói', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/9f23a318-e498-418a-a935-cd62a827e08b.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('3bf99601-bfbc-4ec0-88b1-b1ed25fe93f4', '1bc3b5ef-af58-4e4a-a372-93b51810f894', 'Kẹo mút Chupa Chups', 'Kẹo mút Chupa Chups', 'Cây', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/1e588ea4-3bf9-47f3-9f46-0081fef7d5c3.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('32072f74-dd86-4ab4-8aff-7ae6e4d36e4c', '3a8d0d56-e5bb-4802-a2f3-b3f864047bfb', 'Cà rốt Đà Lạt', 'Cà rốt Đà Lạt', 'Kg', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/9cad4e44-9b49-4060-a017-1322e3f9931a.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('1ea3e554-c2e0-4764-b191-f52ab22ffb68', '3a8d0d56-e5bb-4802-a2f3-b3f864047bfb', 'Khoai tây vàng', 'Khoai tây vàng', 'Kg', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/bf0c9879-17c8-4283-bd52-df263a6888e6.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('649ff236-ea2e-406c-8ac2-4d65589f1c75', '438f7b13-66f0-4dfe-969c-406c3e3f5e8b', 'Mứt xoài dẻo', 'Mứt xoài dẻo', 'Hũ', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/88c93c4f-e247-4461-b88f-bb0d6c6742c0.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('f841ff3b-937d-4a6b-a04e-3fe72919fd7c', '438f7b13-66f0-4dfe-969c-406c3e3f5e8b', 'Mứt vỏ bưởi', 'Mứt vỏ bưởi', 'Hũ', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/80fcc6b1-27c6-42ad-9bf9-cb5c8bacae1e.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('11b41c2c-9812-491b-a480-d94072838f6e', '480d80df-5809-45f4-822b-1ea538cc2eda', 'Bánh flan caramel', 'Bánh flan caramel', 'Hộp', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/bcaecf92-eec8-4cf7-897f-59eb3e061687.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('fd40eb71-57d2-41d9-8f8c-49e8189596dd', '480d80df-5809-45f4-822b-1ea538cc2eda', 'Kem vani hộp', 'Kem vani hộp', 'Hộp', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/349aecab-65e7-4352-86a6-af5891a25224.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('7cb2e42b-bf0f-414e-acf1-0e5de65e3a41', '480d80df-5809-45f4-822b-1ea538cc2eda', 'Thạch trái cây', 'Thạch trái cây', 'Hộp', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/3d350cd3-fc9d-435d-bac0-a79873071069.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('1c65b3cd-77db-4dca-bf82-8a9d786e869a', '4e04d164-b2a0-45c8-9ec3-c186ac5636b2', 'Trà Ô Long Tea+', 'Trà Ô Long Tea+', 'Chai', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/207e7790-55b4-4d19-b477-35ae5aee7b11.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('3cc2f439-6d3f-48d6-a49a-9803fd76d919', '4e04d164-b2a0-45c8-9ec3-c186ac5636b2', 'Cà phê Highlands Blend', 'Cà phê Highlands Blend', 'Gói', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/a894edec-79c3-44f9-9887-5bd6eaaaa92e.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('f5813cac-2a94-42f2-be4a-2337d9328299', '51a5b9d7-696e-410e-b986-a2a79c8a3d23', 'Dầu ăn Neptune', 'Dầu ăn Neptune', 'Chai', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/fe311fdc-c9e2-472c-be5f-b00293dc507f.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('a96a7eee-2e49-4807-8d08-1f825edde390', '51a5b9d7-696e-410e-b986-a2a79c8a3d23', 'Dầu mè Tường An', 'Dầu mè Tường An', 'Chai', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/cc18a7f5-17a5-41b7-b812-b46fb334d389.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('a268770d-b9e6-45b7-9013-7934710ccea6', '51a5b9d7-696e-410e-b986-a2a79c8a3d23', 'Dầu olive Borges', 'Dầu olive Borges', 'Chai', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/4e75ac12-4c93-456f-b7df-4e86b2905ca2.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('1a779c4d-76ce-44dc-a2f3-ecd6507171d7', '85140a36-1583-4a97-a3c2-94cd6b3281e5', 'Hạt nêm Knorr', 'Hạt nêm Knorr', 'Gói', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/bc9c30e0-f1ea-4a4f-9018-66f381d61cc5.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('9f84e5a7-a838-42d7-bc2b-736fbf9a2e64', '85140a36-1583-4a97-a3c2-94cd6b3281e5', 'Bột ngọt Ajinomoto', 'Bột ngọt Ajinomoto', 'Gói', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/1034da9a-569c-477f-84d2-fc09422ba0d0.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('54e4560b-5823-40a8-867b-9cf5b148f0c5', 'a5bf68d4-ec1b-4d2e-9888-1b0aaae78b3c', 'Cá hồi phi lê', 'Cá hồi phi lê', 'Kg', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/762b431a-62db-411f-b5ef-082fcb871405.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('e397ba58-17aa-485b-b458-c7496e06bcd3', 'a5bf68d4-ec1b-4d2e-9888-1b0aaae78b3c', 'Cá basa phi lê', 'Cá basa phi lê', 'Kg', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/238abf94-7284-4675-8ae5-6475fc936354.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('47cb3564-70c2-4e72-bbe5-22ef23712bdf', 'a67e9162-7d36-44f1-a292-57c5d6e7046c', 'Chuối già Nam Bộ', 'Chuối già Nam Bộ', 'Kg', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/a7664b7f-952b-43b6-98ee-29b1a4bc079f.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('a107dd90-6a35-4a2b-9925-76bf3104fd22', 'a67e9162-7d36-44f1-a292-57c5d6e7046c', 'Cam sành', 'Cam sành', 'Kg', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/44f2f3a3-dfb4-4c6d-b9bc-c64f326317bf.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('a6b37c5f-3d61-4099-826b-f6bfb632b11f', 'a67e9162-7d36-44f1-a292-57c5d6e7046c', 'Thanh long ruột đỏ', 'Thanh long ruột đỏ', 'Kg', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/a4b784df-f13d-4bae-ad40-38fcb60acf71.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('71c7b18e-262b-498a-bb17-ab8bf339a544', '4167d356-0ce9-403e-823b-59804680d0af', 'Túi rác tự hủy sinh học', 'Túi rác tự hủy sinh học', 'Cuộn', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/e5c86641-5c92-4ad5-9d1f-e09c2d92c00b.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('a2c56c80-cc7f-480b-a3bb-46555d51161b', '4167d356-0ce9-403e-823b-59804680d0af', 'Hộp đựng thực phẩm Lock&Lock', 'Hộp đựng thực phẩm Lock&Lock', 'Hộp', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/80b350d5-7ea4-4fa3-843d-ba1b15d668a8.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('f7d3c985-9edc-4e4c-a0ac-f137655d71fc', '748f9765-bb9e-46fc-af04-5c9fc5e26a26', 'Mì Omachi sườn hầm', 'Mì Omachi sườn hầm', 'Thùng', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/3f5393e3-a964-4ede-aff7-ccec75c3c209.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('f22018c2-075c-4b89-88d8-ccaf41f12c0b', 'bb73fddf-fcae-45f8-b97b-6cf472db26c0', 'Mayonnaise Ajinomoto', 'Mayonnaise Ajinomoto', 'Chai', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/fb42e7bc-f28f-4eec-ae06-3c2e2a937189.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('f7d801bc-4635-43b1-be60-b49a52d274c9', 'bb73fddf-fcae-45f8-b97b-6cf472db26c0', 'Sốt mè rang Kewpie', 'Sốt mè rang Kewpie', 'Chai', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/624a9251-4ae8-43c2-be27-3f23957eda68.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('6d3afb72-872d-45d9-b84e-0de2fd97e2be', 'c372fc2b-33ab-4965-bac0-6242ce530c23', 'Xúc xích CP Cocktail', 'Xúc xích CP Cocktail', 'Gói', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/ad103e96-f802-4792-b811-f425046c8f22.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('f7c14926-8588-4a61-95b7-7d6504c586db', 'c175ebce-c01a-445f-8f94-9fcd821ecf84', 'Bánh Custas', 'Bánh Custas', 'Hộp', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/f6600eb7-f2a7-486e-82c1-3e6341c866a3.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('29b2af30-6088-4dc0-9188-7e0e46e2caea', 'c372fc2b-33ab-4965-bac0-6242ce530c23', 'Xúc xích Ponnie', 'Xúc xích Ponnie', 'Gói', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/d91a4a49-7da7-4d88-b1b1-404d10335da5.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('2b049671-2213-41f2-9ce4-510f82b97c98', 'c372fc2b-33ab-4965-bac0-6242ce530c23', 'Xúc xích Hồ Lô', 'Xúc xích Hồ Lô', 'Gói', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/6068d680-2ab0-45b7-b55e-01ce459f06a1.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('b2bb7052-56d0-4373-b435-5853ca38186b', 'd8bedadf-a6fb-4078-a71a-a363c7903403', 'Ngũ cốc Nestlé Fitnesse', 'Ngũ cốc Nestlé Fitnesse', 'Hộp', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/33db75a1-94c8-4e5a-8e92-bb69fda1eb5d.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('f665421f-142b-4100-994e-477f0e0d4e9c', 'd8bedadf-a6fb-4078-a71a-a363c7903403', 'Bột ngũ cốc dinh dưỡng', 'Bột ngũ cốc dinh dưỡng', 'Hộp', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/ed52c76d-5f95-4328-9562-8c2784f402a2.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('4bb2f882-2267-4265-91e3-22f141d2b3e2', 'd8bedadf-a6fb-4078-a71a-a363c7903403', 'Granola Calbee', 'Granola Calbee', 'Gói', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/3df16fb7-7003-473e-907b-a5421eeb8443.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('d56778b8-a493-4388-854f-6a12f69ec1e5', 'd8bedadf-a6fb-4078-a71a-a363c7903403', 'Hạt chia Úc', 'Hạt chia Úc', 'Gói', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/a7b51844-605e-45b8-a69a-271439aeaa28.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('953f5a07-43cc-4773-b8ab-e0c7fa43c468', 'd335bdcc-7010-48ed-a43b-b596a9b9070f', 'Tiger Crystal', 'Tiger Crystal', 'Lon', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/426b2d2d-5ba3-41aa-a2c0-5db0bf6e0e7a.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('103b9cf2-9baf-4643-b550-f0189a6a02e5', 'd335bdcc-7010-48ed-a43b-b596a9b9070f', 'Strongbow Táo', 'Strongbow Táo', 'Chai', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/14c03d0a-d8bd-4e47-8bff-d6acd50f3c23.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('99a0ca7c-4ad0-42c5-abcd-ebeefd4eacfe', 'd335bdcc-7010-48ed-a43b-b596a9b9070f', 'Sapporo Premium', 'Sapporo Premium', 'Lon', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/79952588-9533-4ace-bc16-e37456fa9545.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('389ee963-195c-4394-97b8-e2403595d648', 'd335bdcc-7010-48ed-a43b-b596a9b9070f', 'Vang đỏ Chile', 'Vang đỏ Chile', 'Chai', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/a33bb226-1f6b-4cfc-8d1d-ef538c278579.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('8a5e1fea-977a-4dd5-aead-67fdc761d3ed', '748f9765-bb9e-46fc-af04-5c9fc5e26a26', 'Phở bò Vifon', 'Phở bò Vifon', 'Gói', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/dd8b33e1-b6b9-4768-bfcb-3ed00b9d7c1b.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('04dde5f7-6827-468d-aacb-5b9fcf180ecd', '748f9765-bb9e-46fc-af04-5c9fc5e26a26', 'Bún khô Bích Chi', 'Bún khô Bích Chi', 'Gói', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/5db2492d-bfe4-4578-980f-0cc59406beab.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('bd4e9f0f-b042-4735-a5d2-ac975ffb3a2e', '748f9765-bb9e-46fc-af04-5c9fc5e26a26', 'Miến dong Việt Cường', 'Miến dong Việt Cường', 'Gói', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/340a2613-f56c-40bc-9e78-3224f765b50f.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('4f2fc80c-b91d-44eb-8c72-d3835c834782', '041f57c0-c546-4b8c-a94f-91acc9dc9fa6', 'Trà xanh Không Độ', 'Trà xanh Không Độ', 'Chai', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/ff635b68-7601-42a0-aa35-ef4d83188ab9.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('d16a55bd-e303-448a-a288-66520e32d393', '041f57c0-c546-4b8c-a94f-91acc9dc9fa6', 'Pepsi Cola', 'Pepsi Cola', 'Lon', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/80e21646-54e7-4ac5-ae35-12f5ff41b739.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('1d790122-678e-417b-b878-c1e06a72d6d0', '0f35d7bb-57cb-422a-9de8-1fb5e69393b5', 'Sữa chua Vinamilk', 'Sữa chua Vinamilk', 'Lốc', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/abe25add-022b-48e2-acb8-cee1a3406ed7.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('81ae3676-1435-4bac-9970-13c039ba9773', '1bc3b5ef-af58-4e4a-a372-93b51810f894', 'Kẹo Alpenliebe', 'Kẹo Alpenliebe', 'Gói', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/c4f713fa-0095-454e-8150-9b05221f8f12.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('950bf2ea-2439-4959-96c6-997ea521f473', '1bc3b5ef-af58-4e4a-a372-93b51810f894', 'Kẹo Halls chanh mật ong', 'Kẹo Halls chanh mật ong', 'Gói', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/a8bd3fcf-5bbc-44a1-982d-235a221c7a3a.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('66d3f336-3744-441c-a0e1-b3588ecaa3d3', '3a8d0d56-e5bb-4802-a2f3-b3f864047bfb', 'Bắp cải xanh', 'Bắp cải xanh', 'Kg', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/0c0dc00a-21bf-4172-a7b7-d56810cb2517.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('6a6ad6e4-0b8c-4846-a2d4-34ed39e5fc44', '3a8d0d56-e5bb-4802-a2f3-b3f864047bfb', 'Rau muống', 'Rau muống', 'Kg', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/b58b58f5-28b9-433e-8f4f-ab0e182fd1c7.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('fb20a953-f20d-4b75-956d-2c982d8540b0', '438f7b13-66f0-4dfe-969c-406c3e3f5e8b', 'Mứt chùm ruột', 'Mứt chùm ruột', 'Hũ', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/f8350148-8a92-42d1-8914-be448fad6fd1.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('3ecc689c-4ff6-4c9e-be8c-3da0459a9aa9', '480d80df-5809-45f4-822b-1ea538cc2eda', 'Pudding socola', 'Pudding socola', 'Hộp', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/3025641a-ad9c-4836-91ad-e778907e63a4.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('27327536-0af5-45a2-8db5-ae1942067d77', '4e04d164-b2a0-45c8-9ec3-c186ac5636b2', 'Trà Lipton túi lọc', 'Trà Lipton túi lọc', 'Hộp', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/792661fb-0b8f-49af-ac7d-776335d3b1a3.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('a3797d29-9532-4f97-8806-d9cd4ddb4d5d', '51a5b9d7-696e-410e-b986-a2a79c8a3d23', 'Dầu hướng dương Simply', 'Dầu hướng dương Simply', 'Chai', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/aef1ce0d-2dca-405c-a2d5-15c954965c72.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('2a12b43e-2434-417d-b5f1-5eadfee15cde', '85140a36-1583-4a97-a3c2-94cd6b3281e5', 'Tiêu đen xay Dh Foods', 'Tiêu đen xay Dh Foods', 'Hũ', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/589799ea-1d53-4a3f-85f9-38827111a88d.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('e6ebf203-ccb8-4be8-b8f7-771ec8a4411c', 'a5bf68d4-ec1b-4d2e-9888-1b0aaae78b3c', 'Tôm thẻ đông lạnh', 'Tôm thẻ đông lạnh', 'Kg', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/0f6d4291-1d76-423d-8d11-00dba0ce315b.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('19f3abb8-007e-4ca3-8079-ad0cbf330789', '4e04d164-b2a0-45c8-9ec3-c186ac5636b2', 'Cà phê rang xay Trung Nguyên', 'Cà phê rang xay Trung Nguyên', 'Gói', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/3ffce7de-ba06-4395-b11a-ab68fdc89330.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('c7871ebd-c09e-4d5a-ab66-adee3e7129f9', '85140a36-1583-4a97-a3c2-94cd6b3281e5', 'Muối i-ốt Neptune', 'Muối i-ốt Neptune', 'Gói', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/f3f9e7c1-572b-486d-8d8a-964d1c6a4cde.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('52c8cb08-cd32-4710-81b1-6dd88fc58263', 'a5bf68d4-ec1b-4d2e-9888-1b0aaae78b3c', 'Ức gà CP', 'Ức gà CP', 'Kg', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/af060e55-7d35-4376-af68-765b9ac15640.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('faad1099-5611-4f6b-a01a-fce7a64d00c5', 'a67e9162-7d36-44f1-a292-57c5d6e7046c', 'Nho đỏ không hạt', 'Nho đỏ không hạt', 'Kg', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/3cb3c110-2f87-4c62-9a42-54d6ac9c4d5e.png', 'active', '2026-06-11 14:02:54.700818+00', NULL),
	('c20a97db-6f79-4122-abb5-7b3028f85c62', '438f7b13-66f0-4dfe-969c-406c3e3f5e8b', 'Mứt gừng Huế', 'Mứt gừng Huế', 'Túi', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Product-Image/products/2026/8d4f17d7-b634-4faa-b006-10e1c921d4dd.png', 'active', '2026-06-11 14:02:54.700818+00', 'Mứt gừng Huế');


--
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."suppliers" ("supplier_id", "name", "address", "certificate", "status", "description", "created_at") VALUES
	('d3b346de-16da-4a9b-9894-c24a4e3113b8', 'Nhà cung cấp Thịt', 'Địa Chỉ A', 'CERT01', 'approved', 'Cung cấp các loại thịt, cá, trứng, sữa,...', '2026-04-09 09:24:53.815285+00'),
	('17d85de5-fb2e-47c5-8718-f9c1c288c04b', 'Nhà cung cấp Rau', 'Địa Chỉ B', 'CERT02', 'approved', 'Cung cấp các loại thịt, cá, trứng, sữa,...', '2026-04-24 09:20:51.996442+00'),
	('647dc966-7098-4511-9d53-b233ada1de77', 'Nhà cung cấp Đã từ chối', 'Đã từ chối', 'NONE', 'rejected', NULL, '2026-04-24 09:23:28.046999+00'),
	('a27f5bea-2604-4db4-8135-48cafb0571f4', 'Nhà cung cấp Bún, mì, phở,...', 'Địa Chỉ D', 'CERT04', 'approved', 'Cung cấp các loại Bún, mì, phở...', '2026-06-11 13:53:17.899452+00'),
	('299588aa-a18c-4dd8-aac3-d6ef9d637c36', 'Nhà cung cấp Bánh kẹo', 'Địa chỉ C', 'CERT03', 'approved', 'Cung cấp các loại Bánh, kẹo,...', '2026-04-24 12:56:17.814015+00'),
	('dd0f36b8-a7c8-471b-aa90-e02e54c62f3c', 'Nhà cung cấp Thức uống & Đồ ngọt', 'Địa chỉ F', 'CERT06', 'approved', 'Cung cấp Thức uống, Thức uống có cồn, Đồ ngọt, Trà và Cà phê.', '2026-06-11 14:12:10.952353+00'),
	('0d034b65-03b1-4d93-8a4b-1aecebfa4439', 'Nhà cung cấp Gia vị & Nước sốt', 'Địa chỉ G', 'CERT07', 'approved', 'Cung cấp Dầu ăn, Gia vị, Nước sốt và Mứt.', '2026-06-11 14:12:10.952353+00'),
	('0f10d1ad-55a5-4848-af72-69e1c48c69f0', 'Nhà cung cấp Ngũ cốc', 'Địa chỉ H', 'CERT08', 'approved', 'Cung cấp các loại Ngũ cốc dinh dưỡng.', '2026-06-11 14:12:10.952353+00'),
	('c43a5532-e2af-43c2-b6e9-735f3cd47acc', 'Nhà cung cấp Sản phẩm vệ sinh & Gia dụng', 'Địa chỉ E', 'CERT05', 'pending', 'Cung cấp các sản phẩm vệ sinh và đồ dùng gia dụng.', '2026-06-11 14:12:10.952353+00');


--
-- Data for Name: batches; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."batches" ("batch_id", "product_id", "supplier_id", "harvest_date", "expire_date", "quantity", "qr_code", "status", "created_at", "updated_at", "import_price") VALUES
	('0d3b1f08-5444-422e-b2a7-b5685190f47c', '09db94d4-85b3-4dce-af65-430830ab0abd', 'd3b346de-16da-4a9b-9894-c24a4e3113b8', '2026-01-01', '2027-01-01', 100, NULL, 'available', '2026-04-23', NULL, 0),
	('bbbb0001-0000-0000-0000-000000000000', 'aaaa0001-0000-0000-0000-000000000000', 'd3b346de-16da-4a9b-9894-c24a4e3113b8', '2026-03-30', '2026-10-06', 500, 'QR_KEO_01', 'available', '2026-04-23', NULL, 0),
	('bbbb0002-0000-0000-0000-000000000000', 'aaaa0002-0000-0000-0000-000000000000', 'd3b346de-16da-4a9b-9894-c24a4e3113b8', '2026-03-10', '2027-04-09', 200, 'QR_NGUCOC_01', 'available', '2026-04-23', NULL, 0),
	('bbbb0003-0000-0000-0000-000000000000', 'aaaa0003-0000-0000-0000-000000000000', 'd3b346de-16da-4a9b-9894-c24a4e3113b8', '2026-03-25', '2027-04-09', 1000, 'QR_GIAVI_01', 'available', '2026-04-23', NULL, 0),
	('bbbb0004-0000-0000-0000-000000000000', 'aaaa0004-0000-0000-0000-000000000000', 'd3b346de-16da-4a9b-9894-c24a4e3113b8', '2026-04-04', '2026-10-26', 300, 'QR_BIA_01', 'available', '2026-04-23', NULL, 0),
	('bbbb0005-0000-0000-0000-000000000000', 'aaaa0005-0000-0000-0000-000000000000', 'd3b346de-16da-4a9b-9894-c24a4e3113b8', '2026-04-07', '2027-04-09', 5000, 'QR_NUOC_01', 'available', '2026-04-23', NULL, 0),
	('bbbb0006-0000-0000-0000-000000000000', 'aaaa0006-0000-0000-0000-000000000000', 'd3b346de-16da-4a9b-9894-c24a4e3113b8', '2026-04-06', '2026-04-23', 150, 'QR_TAO_01', 'available', '2026-04-23', NULL, 0),
	('bbbb0007-0000-0000-0000-000000000000', 'aaaa0007-0000-0000-0000-000000000000', 'd3b346de-16da-4a9b-9894-c24a4e3113b8', '2026-03-20', '2026-10-06', 100, 'QR_MUT_01', 'available', '2026-04-23', NULL, 0),
	('bbbb0008-0000-0000-0000-000000000000', 'aaaa0008-0000-0000-0000-000000000000', 'd3b346de-16da-4a9b-9894-c24a4e3113b8', '2026-04-08', '2026-04-14', 50, 'QR_THIT_01', 'available', '2026-04-23', NULL, 0),
	('bbbb0009-0000-0000-0000-000000000000', 'aaaa0009-0000-0000-0000-000000000000', 'd3b346de-16da-4a9b-9894-c24a4e3113b8', '2026-03-30', '2026-09-06', 400, 'QR_MI_01', 'available', '2026-04-23', NULL, 0),
	('bbbb0010-0000-0000-0000-000000000000', 'aaaa0010-0000-0000-0000-000000000000', 'd3b346de-16da-4a9b-9894-c24a4e3113b8', '2026-03-10', '2027-04-09', 200, 'QR_DAU_01', 'available', '2026-04-23', NULL, 0),
	('bbbb0011-0000-0000-0000-000000000000', 'aaaa0011-0000-0000-0000-000000000000', 'd3b346de-16da-4a9b-9894-c24a4e3113b8', '2026-04-04', '2026-10-26', 600, 'QR_SOT_01', 'available', '2026-04-23', NULL, 0),
	('bbbb0012-0000-0000-0000-000000000000', 'aaaa0012-0000-0000-0000-000000000000', 'd3b346de-16da-4a9b-9894-c24a4e3113b8', '2026-04-07', '2026-07-08', 800, 'QR_XUCXICH_01', 'available', '2026-04-23', NULL, 0),
	('bbbb0013-0000-0000-0000-000000000000', 'aaaa0013-0000-0000-0000-000000000000', 'd3b346de-16da-4a9b-9894-c24a4e3113b8', '2026-03-25', '2026-10-06', 150, 'QR_SOCOLA_01', 'available', '2026-04-23', NULL, 0),
	('bbbb0014-0000-0000-0000-000000000000', 'aaaa0014-0000-0000-0000-000000000000', 'd3b346de-16da-4a9b-9894-c24a4e3113b8', '2026-03-30', '2027-04-09', 300, 'QR_CAFE_01', 'available', '2026-04-23', NULL, 0),
	('bbbb0015-0000-0000-0000-000000000000', 'aaaa0015-0000-0000-0000-000000000000', 'd3b346de-16da-4a9b-9894-c24a4e3113b8', '2026-02-08', '2028-04-08', 120, 'QR_GIADUNG_01', 'available', '2026-04-23', NULL, 0),
	('bbbb0016-0000-0000-0000-000000000000', 'aaaa0016-0000-0000-0000-000000000000', 'd3b346de-16da-4a9b-9894-c24a4e3113b8', '2026-04-08', '2026-04-13', 80, 'QR_RAU_01', 'available', '2026-04-23', NULL, 0),
	('bbbb0017-0000-0000-0000-000000000000', 'aaaa0017-0000-0000-0000-000000000000', 'd3b346de-16da-4a9b-9894-c24a4e3113b8', '2026-03-20', '2027-04-09', 250, 'QR_BANH_01', 'available', '2026-04-23', NULL, 0),
	('bbbb0018-0000-0000-0000-000000000000', 'aaaa0018-0000-0000-0000-000000000000', 'd3b346de-16da-4a9b-9894-c24a4e3113b8', '2026-04-07', '2026-10-06', 500, 'QR_SUA_01', 'available', '2026-04-23', NULL, 0),
	('e400cb46-85b4-46c2-b2dc-4a4c3782fb4f', 'aaaa0016-0000-0000-0000-000000000000', '17d85de5-fb2e-47c5-8718-f9c1c288c04b', '2026-01-01', '2027-01-01', 400, NULL, 'available', '2026-04-24', NULL, 0),
	('c0b463d1-af22-45b0-b135-8c276a00e114', 'aaaa0016-0000-0000-0000-000000000000', '17d85de5-fb2e-47c5-8718-f9c1c288c04b', '2026-01-01', '2026-01-01', 500, NULL, 'available', '2026-04-24', NULL, 0),
	('4394e952-4426-4f42-b4a5-27603131e186', 'aaaa0002-0000-0000-0000-000000000000', '17d85de5-fb2e-47c5-8718-f9c1c288c04b', '2025-01-01', '2027-01-02', 500, NULL, 'available', '2026-05-08', NULL, 0),
	('cbb8c396-f4f8-4fbd-839a-b5f520f85307', 'aaaa0002-0000-0000-0000-000000000000', '299588aa-a18c-4dd8-aac3-d6ef9d637c36', '2026-05-22', '2026-12-22', 500, NULL, 'available', '2026-05-22', NULL, 0),
	('8de6832c-4e68-45db-994b-3e00171554d5', 'ae8e6914-cb5d-4c75-bd7f-25ca37eab66f', 'c43a5532-e2af-43c2-b6e9-735f3cd47acc', '2026-05-01', '2029-05-01', 100, 'QR_SUN_02', 'available', '2026-06-11', NULL, 25000),
	('8991e267-fc41-4dc8-8049-18d209f21587', '56d38f7d-3ee5-4edf-93e1-920f886ef6a7', 'c43a5532-e2af-43c2-b6e9-735f3cd47acc', '2026-05-10', '2031-05-10', 200, 'QR_PUL_02', 'available', '2026-06-11', NULL, 30000),
	('7c0c5fb3-2b63-41ee-b9d2-8904665181ac', '987aec87-9b1f-498a-ad11-8107f0e44761', 'c43a5532-e2af-43c2-b6e9-735f3cd47acc', '2026-04-15', '2028-04-15', 150, 'QR_VIM-01', 'available', '2026-06-11', NULL, 28000),
	('a238a29e-318a-4a2f-bdaf-3c9431a0ce2c', '12b74edc-1962-41d9-a793-cf9d204fe0a5', 'c43a5532-e2af-43c2-b6e9-735f3cd47acc', '2026-05-20', '2031-05-20', 300, 'QR_TEM_02', 'available', '2026-06-11', NULL, 12000),
	('39fd094e-6ea6-42e0-b356-20fc1fd804d0', '71c7b18e-262b-498a-bb17-ab8bf339a544', 'c43a5532-e2af-43c2-b6e9-735f3cd47acc', '2026-05-01', '2031-05-01', 500, 'QR_TRAC_02', 'available', '2026-06-11', NULL, 15000),
	('89026782-e396-4245-bf98-1628d6307dc4', 'f0957403-2d3b-4d9b-9894-dee180cd297d', 'c43a5532-e2af-43c2-b6e9-735f3cd47acc', '2026-05-05', '2029-05-05', 250, 'QR_MBTP_02', 'available', '2026-06-11', NULL, 18000),
	('254b0ed1-af90-4b15-b8bf-6eccb8763319', 'a2c56c80-cc7f-480b-a3bb-46555d51161b', 'c43a5532-e2af-43c2-b6e9-735f3cd47acc', '2026-04-01', '2036-04-01', 80, 'QR_GIADUNG_02', 'available', '2026-06-11', NULL, 45000),
	('e592efcc-52a6-4260-ac8c-a8676833c488', '2c70d623-ed05-41cd-9fb8-d0ad1352699a', 'c43a5532-e2af-43c2-b6e9-735f3cd47acc', '2026-05-12', '2031-05-12', 400, 'QR_MRCH_02', 'available', '2026-06-11', NULL, 8000),
	('8d97bb21-237a-4c0d-aebf-127db36715cd', '1ec12119-d01c-4fb7-bf87-2c654982a056', '299588aa-a18c-4dd8-aac3-d6ef9d637c36', '2026-05-15', '2027-05-15', 120, 'QR_BANH_02', 'available', '2026-06-11', NULL, 40000),
	('b1bcffd8-499e-4284-a35e-af87110f7cf4', '0871f6bf-ec18-4808-b20f-cbb3d6d4cd7f', '299588aa-a18c-4dd8-aac3-d6ef9d637c36', '2026-05-10', '2027-05-10', 150, 'QR_AFC_02', 'available', '2026-06-11', NULL, 22000),
	('6d900fc0-6c7f-4671-af3f-6da4289a3749', 'f7c14926-8588-4a61-95b7-7d6504c586db', '299588aa-a18c-4dd8-aac3-d6ef9d637c36', '2026-05-18', '2027-05-18', 100, 'QR_CUS_02', 'available', '2026-06-11', NULL, 42000),
	('96ba007e-ee71-4761-9230-f9088d21edcb', '3ffe74cc-2f16-4736-8ee5-facd79ba0fd5', '299588aa-a18c-4dd8-aac3-d6ef9d637c36', '2026-06-01', '2026-08-01', 50, 'QR_PIA_02', 'available', '2026-06-11', NULL, 55000),
	('551576a5-7c59-4397-9223-6739cb8d2aa3', '81ae3676-1435-4bac-9970-13c039ba9773', '299588aa-a18c-4dd8-aac3-d6ef9d637c36', '2026-03-30', '2026-10-06', 500, 'QR_KEO_03', 'available', '2026-06-11', NULL, 12000),
	('0392bfda-d67e-4bae-8383-57d1354a3910', 'a473f753-91c8-496b-b9e5-f77c23776aa6', '299588aa-a18c-4dd8-aac3-d6ef9d637c36', '2026-05-05', '2027-11-05', 250, 'QR_MEN_02', 'available', '2026-06-11', NULL, 13000),
	('98407348-494a-4539-aa0f-57883a2eb386', '950bf2ea-2439-4959-96c6-997ea521f473', '299588aa-a18c-4dd8-aac3-d6ef9d637c36', '2026-04-20', '2027-10-20', 200, 'QR_HAL_02', 'available', '2026-06-11', NULL, 17000),
	('b2836a24-28c0-4c8e-a0e9-ed979a040027', '3bf99601-bfbc-4ec0-88b1-b1ed25fe93f4', '299588aa-a18c-4dd8-aac3-d6ef9d637c36', '2026-05-10', '2028-05-10', 500, 'QR_CC_02', 'available', '2026-06-11', NULL, 2000),
	('eaae07ac-cecd-4e2a-a946-da7519b08d23', '4f2fc80c-b91d-44eb-8c72-d3835c834782', 'dd0f36b8-a7c8-471b-aa90-e02e54c62f3c', '2026-04-07', '2027-04-09', 5000, 'QR_NUOC_02', 'available', '2026-06-11', NULL, 6500),
	('8025140f-6667-4611-9cdc-7b46d9d47641', 'b7dffd36-d28a-400e-b719-0b74783569de', 'dd0f36b8-a7c8-471b-aa90-e02e54c62f3c', '2026-05-18', '2027-05-18', 300, 'QR_TWI_02', 'available', '2026-06-11', NULL, 7000),
	('e02f7956-4259-4bd3-991c-46e252eb5d68', '62d661b4-1b03-4f14-837e-6bdfc78b2dd7', 'dd0f36b8-a7c8-471b-aa90-e02e54c62f3c', '2026-06-01', '2027-06-01', 500, 'QR_STI_02', 'available', '2026-06-11', NULL, 7500),
	('249c9a4c-c8b7-4598-a7e4-5160601b48da', 'd16a55bd-e303-448a-a288-66520e32d393', 'dd0f36b8-a7c8-471b-aa90-e02e54c62f3c', '2026-05-25', '2027-05-25', 600, 'QR_PEP_02', 'available', '2026-06-11', NULL, 6000),
	('c479af39-5e16-4ae7-8215-a7054be03fec', '11b41c2c-9812-491b-a480-d94072838f6e', 'dd0f36b8-a7c8-471b-aa90-e02e54c62f3c', '2026-06-10', '2026-06-30', 80, 'QR_FLAN_02', 'available', '2026-06-11', NULL, 4500),
	('a5dca023-34e8-430c-a7ff-26f154889040', '3ecc689c-4ff6-4c9e-be8c-3da0459a9aa9', 'dd0f36b8-a7c8-471b-aa90-e02e54c62f3c', '2026-03-25', '2026-10-06', 150, 'QR_SOCOLA_02', 'available', '2026-06-11', NULL, 5000),
	('bb839d8d-8b54-49bb-b2a8-5fc340229ed6', 'fd40eb71-57d2-41d9-8f8c-49e8189596dd', 'dd0f36b8-a7c8-471b-aa90-e02e54c62f3c', '2026-05-15', '2027-05-15', 50, 'QR_KEM_02', 'available', '2026-06-11', NULL, 35000),
	('ebe6b1ad-754c-4d32-8819-e2edbc74f9c4', '7cb2e42b-bf0f-414e-acf1-0e5de65e3a41', 'dd0f36b8-a7c8-471b-aa90-e02e54c62f3c', '2026-05-10', '2027-05-10', 150, 'QR_THACH_02', 'available', '2026-06-11', NULL, 12000),
	('517f7276-cafb-4fa3-bcd6-aaccaa549109', '103b9cf2-9baf-4643-b550-f0189a6a02e5', 'dd0f36b8-a7c8-471b-aa90-e02e54c62f3c', '2026-04-04', '2026-10-26', 300, 'QR_BIA_02', 'available', '2026-06-11', NULL, 16000),
	('e6bd2ec3-1ce1-46ae-950e-151f964fbfc2', '99a0ca7c-4ad0-42c5-abcd-ebeefd4eacfe', 'dd0f36b8-a7c8-471b-aa90-e02e54c62f3c', '2026-05-01', '2027-05-01', 240, 'QR_SAP_02', 'available', '2026-06-11', NULL, 18000),
	('34eb3382-0b20-4875-a0eb-c444f5697992', '389ee963-195c-4394-97b8-e2403595d648', 'dd0f36b8-a7c8-471b-aa90-e02e54c62f3c', '2025-12-01', '2030-12-01', 40, 'QR_VANG_02', 'available', '2026-06-11', NULL, 150000),
	('a63bd162-f3b2-41c1-bf18-31556a4cd6a4', '953f5a07-43cc-4773-b8ab-e0c7fa43c468', 'dd0f36b8-a7c8-471b-aa90-e02e54c62f3c', '2026-05-20', '2027-05-20', 480, 'QR_TIG_02', 'available', '2026-06-11', NULL, 14500),
	('2898d6a0-f4b1-4f87-9920-86bc57ef48fe', '27327536-0af5-45a2-8db5-ae1942067d77', 'dd0f36b8-a7c8-471b-aa90-e02e54c62f3c', '2026-05-01', '2028-05-01', 200, 'QR_LIP_02', 'available', '2026-06-11', NULL, 21000),
	('871157ac-3725-4477-949c-84aca0641213', '1c65b3cd-77db-4dca-bf82-8a9d786e869a', 'dd0f36b8-a7c8-471b-aa90-e02e54c62f3c', '2026-05-25', '2027-05-25', 400, 'QR_TEA_02', 'available', '2026-06-11', NULL, 7000),
	('ee04ef4b-f3db-4ed1-a6a0-e43dc84971e4', '19f3abb8-007e-4ca3-8079-ad0cbf330789', 'dd0f36b8-a7c8-471b-aa90-e02e54c62f3c', '2026-03-30', '2027-04-09', 300, 'QR_CAFE_02', 'available', '2026-06-11', NULL, 48000),
	('e7c52997-2583-46d9-94e4-069215e5be8c', '3cc2f439-6d3f-48d6-a49a-9803fd76d919', 'dd0f36b8-a7c8-471b-aa90-e02e54c62f3c', '2026-05-12', '2027-11-12', 100, 'QR_HL_02', 'available', '2026-06-11', NULL, 52000),
	('8da880fa-7e8b-4dc6-8b3f-c5b21969bf49', '32072f74-dd86-4ab4-8aff-7ae6e4d36e4c', '17d85de5-fb2e-47c5-8718-f9c1c288c04b', '2026-06-10', '2026-06-17', 100, 'QR_ROT_02', 'available', '2026-06-11', NULL, 15000),
	('f6ca98cf-e34f-4fdc-9b90-f5881e04eef5', '66d3f336-3744-441c-a0e1-b3588ecaa3d3', '17d85de5-fb2e-47c5-8718-f9c1c288c04b', '2026-06-11', '2026-06-16', 120, 'QR_CAI_02', 'available', '2026-06-11', NULL, 12000),
	('1791903d-269b-447e-8f95-a3f1275e190c', '1ea3e554-c2e0-4764-b191-f52ab22ffb68', '17d85de5-fb2e-47c5-8718-f9c1c288c04b', '2026-06-08', '2026-06-22', 150, 'QR_TAY_02', 'available', '2026-06-11', NULL, 18000),
	('14f8e6b4-5b7e-4e33-8bb8-cf872b823e67', '6a6ad6e4-0b8c-4846-a2d4-34ed39e5fc44', '17d85de5-fb2e-47c5-8718-f9c1c288c04b', '2026-04-08', '2026-04-13', 80, 'QR_RAU_02', 'available', '2026-06-11', NULL, 8000),
	('52bffe09-ed2f-409f-8cf7-b279cba1874c', '47cb3564-70c2-4e72-bbe5-22ef23712bdf', '17d85de5-fb2e-47c5-8718-f9c1c288c04b', '2026-06-09', '2026-06-15', 200, 'QR_CHU_02', 'available', '2026-06-11', NULL, 14000),
	('f1994221-0020-4df2-97ed-99ec21a5fd8a', 'a107dd90-6a35-4a2b-9925-76bf3104fd22', '17d85de5-fb2e-47c5-8718-f9c1c288c04b', '2026-06-10', '2026-06-20', 150, 'QR_CAM_02', 'available', '2026-06-11', NULL, 22000),
	('c2a35ce2-272b-4740-8eb8-aa7d9261d718', 'faad1099-5611-4f6b-a01a-fce7a64d00c5', '17d85de5-fb2e-47c5-8718-f9c1c288c04b', '2026-04-06', '2026-04-23', 150, 'QR_TAO_02', 'available', '2026-06-11', NULL, 65000),
	('0ba0ab3d-e88f-49e8-a019-7ec1541dd0f0', 'a6b37c5f-3d61-4099-826b-f6bfb632b11f', '17d85de5-fb2e-47c5-8718-f9c1c288c04b', '2026-06-11', '2026-06-17', 100, 'QR_TL_02', 'available', '2026-06-11', NULL, 16000),
	('3181dc59-230e-436a-824d-b0b5abd6a82f', 'c20a97db-6f79-4122-abb5-7b3028f85c62', '0d034b65-03b1-4d93-8a4b-1aecebfa4439', '2026-05-01', '2027-05-01', 60, 'QR_MG_02', 'available', '2026-06-11', NULL, 28000),
	('5276905c-ddba-486d-b117-6db0b325a164', '649ff236-ea2e-406c-8ac2-4d65589f1c75', '0d034b65-03b1-4d93-8a4b-1aecebfa4439', '2026-05-05', '2027-05-05', 70, 'QR_MX_02', 'available', '2026-06-11', NULL, 32000),
	('181c4a3d-f789-426a-b6a1-bdae947d491a', 'f841ff3b-937d-4a6b-a04e-3fe72919fd7c', '0d034b65-03b1-4d93-8a4b-1aecebfa4439', '2026-04-28', '2027-04-28', 50, 'QR_MVB_02', 'available', '2026-06-11', NULL, 35000),
	('e65c46bc-3109-4667-8e7d-8e5c7a033944', 'fb20a953-f20d-4b75-956d-2c982d8540b0', '0d034b65-03b1-4d93-8a4b-1aecebfa4439', '2026-03-20', '2026-10-06', 100, 'QR_MUT_02', 'available', '2026-06-11', NULL, 25000),
	('c450c682-401b-4c45-acb3-5c76c9239590', 'c7871ebd-c09e-4d5a-ab66-adee3e7129f9', '0d034b65-03b1-4d93-8a4b-1aecebfa4439', '2026-03-25', '2027-04-09', 1000, 'QR_GIAVI_02', 'available', '2026-06-11', NULL, 4000),
	('990d05b9-ff73-4460-ae5a-5861ceed1730', '1a779c4d-76ce-44dc-a2f3-ecd6507171d7', '0d034b65-03b1-4d93-8a4b-1aecebfa4439', '2026-05-15', '2027-11-15', 200, 'QR_KNOR_02', 'available', '2026-06-11', NULL, 26000),
	('8360c45c-b7ca-4ccb-83aa-36f398e24aef', '2a12b43e-2434-417d-b5f1-5eadfee15cde', '0d034b65-03b1-4d93-8a4b-1aecebfa4439', '2026-05-02', '2028-05-02', 150, 'QR_TIEU_02', 'available', '2026-06-11', NULL, 14000),
	('b853b385-e376-4914-aa50-d67a38ba065d', '9f84e5a7-a838-42d7-bc2b-736fbf9a2e64', '0d034b65-03b1-4d93-8a4b-1aecebfa4439', '2026-04-20', '2029-04-20', 250, 'QR_AJI_02', 'available', '2026-06-11', NULL, 24000),
	('284d62d6-d808-46a7-a1b0-2565069a364d', '26bf6bec-ecd8-4a5a-a30b-fb7de3bca747', '0d034b65-03b1-4d93-8a4b-1aecebfa4439', '2026-05-20', '2027-05-20', 180, 'QR_CSU_02', 'available', '2026-06-11', NULL, 11000),
	('e29794ba-1472-4456-abad-29dbd87002c8', 'f22018c2-075c-4b89-88d8-ccaf41f12c0b', '0d034b65-03b1-4d93-8a4b-1aecebfa4439', '2026-05-18', '2027-05-18', 120, 'QR_MAYO_02', 'available', '2026-06-11', NULL, 27000),
	('4a70bac0-b3a8-41a8-966f-19f914da3566', 'f7d801bc-4635-43b1-be60-b49a52d274c9', '0d034b65-03b1-4d93-8a4b-1aecebfa4439', '2026-05-22', '2027-05-22', 140, 'QR_SMR_02', 'available', '2026-06-11', NULL, 38000),
	('c16f371a-de87-4d71-b537-b5a9972bc22c', 'f5813cac-2a94-42f2-be4a-2337d9328299', '0d034b65-03b1-4d93-8a4b-1aecebfa4439', '2026-04-20', '2028-04-20', 150, 'QR_NEP_02', 'available', '2026-06-11', NULL, 38000),
	('781062db-cc9f-44c2-a96f-74ed596ae255', 'a3797d29-9532-4f97-8806-d9cd4ddb4d5d', '0d034b65-03b1-4d93-8a4b-1aecebfa4439', '2026-05-01', '2028-05-01', 120, 'QR_SIM_02', 'available', '2026-06-11', NULL, 42000),
	('198696ec-ce91-4434-beca-6509769b7ee8', 'a96a7eee-2e49-4807-8d08-1f825edde390', '0d034b65-03b1-4d93-8a4b-1aecebfa4439', '2026-05-05', '2028-05-05', 180, 'QR_TA_02', 'available', '2026-06-11', NULL, 28000),
	('ba128019-2029-4d37-b522-76f766d47f83', 'a268770d-b9e6-45b7-9013-7934710ccea6', '0d034b65-03b1-4d93-8a4b-1aecebfa4439', '2026-03-10', '2027-04-09', 200, 'QR_DAU_02', 'available', '2026-06-11', NULL, 75000),
	('6dbd5e73-a454-4caf-aa04-23b79efc591c', '06b97f7b-09a7-461d-a763-8bd2b30d4c4d', 'd3b346de-16da-4a9b-9894-c24a4e3113b8', '2026-05-10', '2027-11-10', 200, 'QR_SOTH_02', 'available', '2026-06-11', NULL, 18000),
	('ada6fa92-09cf-43e0-bc0c-83dc12369cf9', '1d790122-678e-417b-b878-c1e06a72d6d0', 'd3b346de-16da-4a9b-9894-c24a4e3113b8', '2026-06-05', '2026-07-20', 300, 'QR_SUA_02', 'available', '2026-06-11', NULL, 22000),
	('1a39cfd7-6f63-4a52-aef2-1081ef5406fb', '85c71bf7-df89-407c-9076-2f44bbad2133', 'd3b346de-16da-4a9b-9894-c24a4e3113b8', '2026-05-20', '2027-02-20', 150, 'QR_TH_02', 'available', '2026-06-11', NULL, 32000),
	('4f7e0e65-0f85-43ec-ba67-260bbc78578c', 'ee332a56-b083-44eb-be61-177d6618f79d', 'd3b346de-16da-4a9b-9894-c24a4e3113b8', '2026-05-25', '2027-01-25', 250, 'QR_FAMI_02', 'available', '2026-06-11', NULL, 13000),
	('e045f503-ce4e-40a6-bbcd-4cb3ae14b469', '54e4560b-5823-40a8-867b-9cf5b148f0c5', 'd3b346de-16da-4a9b-9894-c24a4e3113b8', '2026-06-10', '2026-09-10', 40, 'QR_CH_02', 'available', '2026-06-11', NULL, 280000),
	('629ec3cd-4b9f-4595-8fd8-07830ed13c39', '52c8cb08-cd32-4710-81b1-6dd88fc58263', 'd3b346de-16da-4a9b-9894-c24a4e3113b8', '2026-04-08', '2026-04-14', 50, 'QR_THIT_02', 'available', '2026-06-11', NULL, 65000),
	('4eb907ac-f757-464f-beca-b4b234db4348', 'e397ba58-17aa-485b-b458-c7496e06bcd3', 'd3b346de-16da-4a9b-9894-c24a4e3113b8', '2026-06-09', '2026-09-09', 100, 'QR_BS_02', 'available', '2026-06-11', NULL, 50000),
	('652878f4-e228-468f-b92e-fd6f690acdc8', 'e6ebf203-ccb8-4be8-b8f7-771ec8a4411c', 'd3b346de-16da-4a9b-9894-c24a4e3113b8', '2026-06-08', '2026-12-08', 70, 'QR_TOM_02', 'available', '2026-06-11', NULL, 140000),
	('2c265d10-f751-4e9b-967b-9eaccb6b055c', '014d3c33-add9-4844-911a-8086bfea38f6', 'd3b346de-16da-4a9b-9894-c24a4e3113b8', '2026-04-07', '2026-07-08', 800, 'QR_XUCXICH_02', 'available', '2026-06-11', NULL, 35000),
	('69260bb6-3dbf-4afc-9430-2a1d4c1ffbc0', '6d3afb72-872d-45d9-b84e-0de2fd97e2be', 'd3b346de-16da-4a9b-9894-c24a4e3113b8', '2026-05-22', '2026-07-22', 150, 'QR_XXCP_02', 'available', '2026-06-11', NULL, 28000),
	('dfe06490-7ac5-4740-b6fb-82ca5882351b', '29b2af30-6088-4dc0-9188-7e0e46e2caea', 'd3b346de-16da-4a9b-9894-c24a4e3113b8', '2026-05-15', '2026-11-15', 200, 'QR_XXPN_02', 'available', '2026-06-11', NULL, 8000),
	('c7529e89-8838-491b-a54d-c2f051c42f7e', '2b049671-2213-41f2-9ce4-510f82b97c98', 'd3b346de-16da-4a9b-9894-c24a4e3113b8', '2026-06-01', '2026-09-01', 100, 'QR_XXHL_02', 'available', '2026-06-11', NULL, 45000),
	('fd82f36d-8682-4791-bf05-1f32e09151b3', '8a5e1fea-977a-4dd5-aead-67fdc761d3ed', 'a27f5bea-2604-4db4-8135-48cafb0571f4', '2026-05-10', '2027-05-10', 300, 'QR_PHO_02', 'available', '2026-06-11', NULL, 6000),
	('e4022690-924b-420f-8bd7-62c958513f07', '04dde5f7-6827-468d-aacb-5b9fcf180ecd', 'a27f5bea-2604-4db4-8135-48cafb0571f4', '2026-05-01', '2027-05-01', 150, 'QR_BUNK_02', 'available', '2026-06-11', NULL, 14000),
	('17e6518b-02c1-4b05-9592-5bc8ac7b6f9c', 'bd4e9f0f-b042-4735-a5d2-ac975ffb3a2e', 'a27f5bea-2604-4db4-8135-48cafb0571f4', '2026-04-15', '2027-04-15', 120, 'QR_MD_02', 'available', '2026-06-11', NULL, 22000),
	('0c124119-ee48-494f-9c33-203cfd1d4088', 'f7d3c985-9edc-4e4c-a0ac-f137655d71fc', 'a27f5bea-2604-4db4-8135-48cafb0571f4', '2026-03-30', '2026-09-06', 400, 'QR_MI_02', 'available', '2026-06-11', NULL, 165000),
	('4dba427c-ae70-4698-a1b3-1711dab8022b', 'b2bb7052-56d0-4373-b435-5853ca38186b', '0f10d1ad-55a5-4848-af72-69e1c48c69f0', '2026-04-10', '2027-04-10', 80, 'QR_FIT_02', 'available', '2026-06-11', NULL, 75000),
	('3c20ea8f-ebcf-47a4-8615-d9338c8915f3', 'f665421f-142b-4100-994e-477f0e0d4e9c', '0f10d1ad-55a5-4848-af72-69e1c48c69f0', '2026-03-10', '2027-04-09', 200, 'QR_NGUCOC_02', 'available', '2026-06-11', NULL, 45000),
	('c792b122-959d-49eb-9621-2cb0333a8b53', '4bb2f882-2267-4265-91e3-22f141d2b3e2', '0f10d1ad-55a5-4848-af72-69e1c48c69f0', '2026-04-20', '2027-04-20', 100, 'QR_CAL_02', 'available', '2026-06-11', NULL, 135000),
	('b08fcd94-0710-4191-9979-d07be452aeab', 'd56778b8-a493-4388-854f-6a12f69ec1e5', '0f10d1ad-55a5-4848-af72-69e1c48c69f0', '2026-03-10', '2027-03-10', 120, 'QR_CHIA_02', 'available', '2026-06-11', NULL, 85000);


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."roles" ("role_id", "role_name", "description", "is_customer", "is_admin", "is_manager", "is_employee", "is_shipper") VALUES
	('6e11d5d2-4d35-4cb3-acae-2dc7aa4f97f3', 'Shipper', 'Role Shipper, là những người giao hàng của GreenPlus.', false, false, false, false, true),
	('24487f27-1ce7-403e-8bdc-71a9166a3a3b', 'customer', 'Role Khách hàng, đại diện cho các người dùng của GreenPlus!', true, false, false, false, false),
	('98440486-98e1-41db-b504-d3c6294b1a02', 'admin', 'Role Quản trị viên, Dùng để Quản lý đầy đủ GreenPlus.', false, true, false, false, false),
	('893af31b-30b7-4f14-b7b8-f45eae9b9a6a', 'employee', 'Role Nhân viên, Dùng để Sử dụng giới hạn các chức năng Admin GreenPlus.', false, false, false, true, false),
	('3c877d31-3a26-4e5f-8733-9669563d56d3', 'manager', 'Role Quản lý, đại diện cho quản lý bên GreenPlus.', false, false, true, false, false);


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."users" ("user_id", "role_id", "name", "email", "password", "phone", "address", "status", "created_at", "image_url", "store_id") VALUES
	('b965bce8-faac-41f7-9630-b4a4d6754773', '24487f27-1ce7-403e-8bdc-71a9166a3a3b', 'Nhà sáng tạo 1', 'greencreator1@gmail.com', 'pbkdf2$100000$fba149ace5b0a1eab91bf100b3f532fb$e6018b50e39acd083d90c91aa20b2598794a1198455285857b2fb40faadabeb938b867b512bee83cb4047e1c34a193a784350393d944a7f533f81b8654a666fa', NULL, NULL, 'active', '2026-04-10 10:04:27.087333+00', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQpkRfchp96mz9dt90JWaL_kh4e0EBBCyfLOA&s', NULL),
	('f374c5bf-ed02-4793-bbd8-dae9ca816a36', '24487f27-1ce7-403e-8bdc-71a9166a3a3b', 'Tài khoản kiểm thử', 'testaccount@email.com', 'pbkdf2$100000$4c89734e448b05be6ae36b2b5a32abdf$95eb149e6093af2410ac249ad5682bec23e5e6b46f08c42d2dfb0f358695d56485447e648387f1f25a1e40360e8bf1e6ba5d1fc83beda9e7774c017c83025598', '0394008204', 'Đây là địa chỉ nhập Test', 'active', '2026-06-11 06:32:05.091783+00', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/User_Images/f374c5bf-ed02-4793-bbd8-dae9ca816a36/1781164406078-e289de4b26437.png', NULL),
	('8b0c62f9-fd18-4abb-90f8-fd336d0e3c99', '6e11d5d2-4d35-4cb3-acae-2dc7aa4f97f3', 'Shipper', 'shipper@email.com', 'pbkdf2$120000$e51df06affcd2ab8fbe2d09575ee1ba8$400cb3e1a29d3a824cd3bce96d0e513f7bdcfd43c568225de35a7d6547858a602030f9b17d1a02beeaed4965d954fd28698e240280d103c62af43ca736aa7141', '0123456789', 'Shipper', 'active', '2026-04-26 15:51:52.048854+00', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/User_Images/users/2026/6f80b374-d7ee-4014-ad4f-17adb7401a5a.png', 'f797ceee-90b6-454d-a464-266739241990'),
	('6bd2f08a-3cfb-49b1-b07f-05fe031ce589', '24487f27-1ce7-403e-8bdc-71a9166a3a3b', 'Nhà sáng tạo Test', 'greencreator2@gmail.com', 'pbkdf2$100000$52cf239ee840f267026cf7c5500d24e5$a1322e6a8b7d58ad544f04f3d4233c86ac0b68598db2a056932ec4ea5c2a5238f576200d9abcb3b0fa6961b63da637df21e535ce858b2e0e36ede4e9b686ac9b', '0123456723', NULL, 'active', '2026-04-10 10:04:36.066989+00', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQtkCxRMhDDsEHuGxaoGYwt2vprah0rIEfTfw&s', NULL),
	('24407af9-b1e0-4169-9b9d-ec244bc54f9c', '893af31b-30b7-4f14-b7b8-f45eae9b9a6a', 'Nhân viên', 'employee@email.com', 'pbkdf2$120000$f19d31c28031b0e348c64d2effd26567$62dca4b384432dafc8e04426dd8c27ba715793b66d6f8af9229bc2c238b1164d228e51a45ef38b98d165f94fa4369768ee600a757aff6d686856c3f30dd0b980', '0394008204', 'Test Sửa địa chỉ', 'active', '2026-04-24 13:22:47.603375+00', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/User_Images/users/2026/84389787-b888-4518-8556-89c94b473f99.jpg', 'f797ceee-90b6-454d-a464-266739241990'),
	('3459b69a-2e3c-47bc-855f-8f244fc2a865', '24487f27-1ce7-403e-8bdc-71a9166a3a3b', 'Nguyễn Thiên Dương', 'thienduong@email.com', 'pbkdf2$100000$b22483d7bb4b358e615accc8fc79b026$cd3dbbe7fbea8547f177635778448520e0dbe95fb4d7bb1d1c98c35edc2cd7036498650194e7db79c865afcb43cd82ecc215e9683ecef7def10d7714ac3b99ec', '0394008204', 'Địa Chỉ Giao Hàng', 'active', '2026-04-08 15:07:02.730207+00', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/User_Images/3459b69a-2e3c-47bc-855f-8f244fc2a865/1776874976199-5f8597da08fb2.png', NULL),
	('aa21d783-31ea-4b77-93c6-3bb9c0ec9f57', '3c877d31-3a26-4e5f-8733-9669563d56d3', 'Quản lý', 'manager@email.com', 'pbkdf2$100000$21680fdc40ac4078fd3f8ddcd3b2a3eb$3916a4f5eaf727db7e58217c01210f30538525b79f0f0230aa5f179fe0721a1d8a4457022e8127f335d41462040aec6a59c40fed34a0b4627409b45ea65b650a', '0123456789', 'Địa chỉ nhà ở Manager', 'active', '2026-05-21 14:40:33.814931+00', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/User_Images/users/2026/7a78db24-54c0-4471-9e94-7d8a31bf4431.png', 'f797ceee-90b6-454d-a464-266739241990'),
	('cd1e5410-5d6f-42e4-b7a7-41e66766aae3', '24487f27-1ce7-403e-8bdc-71a9166a3a3b', 'Nhà sáng tạo 2', 'testnew@email.com', 'pbkdf2$100000$90f2562dca0f1dfb7adb0b3b5a584683$f38b51d3bcafee83420d728092c1d10f0077bf05c9e556763bf7b48a968be29595eb9350f9576b5150a433770e01265748c272ebff941873eaf1037ad0b7cf01', '0394008204', 'Địa chỉ mới!', 'active', '2026-05-13 10:27:03.79987+00', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/User_Images/users/2026/5b3d0230-6830-4ad8-9a22-7232ae58729d.jpg', NULL),
	('72c0105f-724a-49f6-a47f-0528118b5361', '98440486-98e1-41db-b504-d3c6294b1a02', 'Thiên Dương', 'admin@email.com', 'pbkdf2$100000$ec9b5a9f62dc15effafb484037ccd5e2$ec14918b28884c273c774e6e7fd17cbf0851339208c81d0f4f8e93bdb344bfe9b0c9ab59e3b4c37edba1484017a7500f965c3f3309f24580c93e0654bd89667f', '0394008204', 'Khu phố 34, Phường Linh Xuân, Thành phố Hồ Chí Minh', 'active', '2026-04-23 06:06:28.666208+00', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/User_Images/users/2026/858a4ed6-8187-442b-9287-16fe7f2478ac.png', 'f797ceee-90b6-454d-a464-266739241990');


--
-- Data for Name: carts; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."carts" ("cart_id", "user_id", "created_at", "updated_at") VALUES
	('7516aa6b-05cf-434a-ba9a-c382f5e4615a', '3459b69a-2e3c-47bc-855f-8f244fc2a865', '2026-04-08 17:05:25.218979+00', NULL),
	('8fb4640e-fc52-472c-a91c-803dc3c37d8d', '72c0105f-724a-49f6-a47f-0528118b5361', '2026-05-07 16:13:54.346097+00', NULL),
	('1db65368-7a0a-4adf-9b48-093a2e4fa14f', 'cd1e5410-5d6f-42e4-b7a7-41e66766aae3', '2026-05-13 15:08:29.545373+00', NULL),
	('a86ecc57-c7a8-4ea1-8d10-f3816037eb99', 'f374c5bf-ed02-4793-bbd8-dae9ca816a36', '2026-06-11 07:58:06.835772+00', NULL);


--
-- Data for Name: cart_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."cart_items" ("cart_item_id", "cart_id", "product_id", "quantity", "note", "created_at") VALUES
	('4afaef59-35ff-4139-a807-301e0f2b8b6e', '1db65368-7a0a-4adf-9b48-093a2e4fa14f', 'aaaa0002-0000-0000-0000-000000000000', 1, NULL, '2026-05-13 16:33:10.992196+00'),
	('064ac1b4-8558-4904-8b5f-e973ce9eb44f', '7516aa6b-05cf-434a-ba9a-c382f5e4615a', 'aaaa0004-0000-0000-0000-000000000000', 1, NULL, '2026-06-09 13:10:55.00767+00');


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."orders" ("order_id", "user_id", "order_date", "status", "total_amount", "delivery_address", "delivery_fee", "note", "created_at", "updated_at") VALUES
	('12d452c6-c10b-4f98-a0bb-a5c4dcf17d14', '3459b69a-2e3c-47bc-855f-8f244fc2a865', '2026-04-09 10:50:11.04787+00', 'cancelled', 210000.00, 'Địa Chỉ Giao Hàng', 15000.00, NULL, '2026-04-09 10:50:11.04787+00', NULL),
	('3a24f00e-c936-40bf-aa8d-c11f8d2e8075', 'f374c5bf-ed02-4793-bbd8-dae9ca816a36', '2026-06-11 08:47:37.658252+00', 'completed', 427500.00, 'Đây là địa chỉ nhập Test', 15000.00, 'Bắt đầu giao hàng', '2026-06-11 08:47:37.658252+00', '2026-06-15'),
	('7a2c55d3-60b4-4c05-ba1f-fe8ad2f61aa3', '3459b69a-2e3c-47bc-855f-8f244fc2a865', '2026-05-08 12:51:14.550204+00', 'completed', 200000.00, 'Địa Chỉ Giao Hàng', 15000.00, 'Giao hàng', '2026-05-08 12:51:14.550204+00', '2026-05-08'),
	('94cabf76-e9d4-43e2-a27a-82cfb9f93533', '3459b69a-2e3c-47bc-855f-8f244fc2a865', '2026-04-09 16:55:54.22242+00', 'delivering', 200000.00, 'Địa Chỉ Giao Hàng', 15000.00, NULL, '2026-04-09 16:55:54.22242+00', NULL),
	('72816803-8fd2-46e2-93f2-bb84678640d8', 'cd1e5410-5d6f-42e4-b7a7-41e66766aae3', '2026-05-13 15:10:15.560569+00', 'completed', 535000.00, 'Địa chỉ mới!', 15000.00, NULL, '2026-05-13 15:10:15.560569+00', '2026-05-15'),
	('3e6f9fc7-1830-4d02-907a-59b7191c2e2e', '3459b69a-2e3c-47bc-855f-8f244fc2a865', '2026-04-10 06:34:15.359417+00', 'completed', 685000.00, 'Địa Chỉ Giao Hàng', 15000.00, NULL, '2026-04-10 06:34:15.359417+00', NULL),
	('4c07473f-4926-4cef-adf0-2c69b8341e83', 'cd1e5410-5d6f-42e4-b7a7-41e66766aae3', '2026-05-13 15:09:26.51468+00', 'completed', 465000.00, 'Địa chỉ mới!', 15000.00, NULL, '2026-05-13 15:09:26.51468+00', '2026-06-15'),
	('135bd383-393f-4614-bd3d-3b2b8292b36c', '3459b69a-2e3c-47bc-855f-8f244fc2a865', '2026-04-09 17:51:43.297089+00', 'confirmed', 315000.00, 'Địa Chỉ Giao Hàng', 15000.00, 'Xác nhận nhanh từ bảng đơn hàng', '2026-04-09 17:51:43.297089+00', '2026-04-26'),
	('8eefdb9d-d953-44ce-8ad6-b180ec09c70f', '3459b69a-2e3c-47bc-855f-8f244fc2a865', '2026-05-08 10:30:37.153807+00', 'completed', 385000.00, 'Địa Chỉ Giao Hàng', 15000.00, NULL, '2026-05-08 10:30:37.153807+00', '2026-06-15'),
	('e2d17c93-3ded-4a01-80d2-dd117b791434', '3459b69a-2e3c-47bc-855f-8f244fc2a865', '2026-04-09 10:37:10.208293+00', 'delivering', 19500.00, 'Địa Chỉ Giao Hàng', 0.00, 'test', '2026-04-09 10:37:10.208293+00', '2026-04-26'),
	('8db32567-04ff-4311-a900-054c41e2a569', '3459b69a-2e3c-47bc-855f-8f244fc2a865', '2026-05-08 09:27:29.54419+00', 'completed', 40000.00, 'Địa Chỉ Giao Hàng', 15000.00, 'Giao hàng thành công', '2026-05-08 09:27:29.54419+00', '2026-06-15'),
	('a7738187-d043-4389-8c93-11219e91f6f9', '3459b69a-2e3c-47bc-855f-8f244fc2a865', '2026-04-17 12:41:13.275249+00', 'preparing', 500000.00, 'Địa Chỉ Giao Hàng', 15000.00, 'Bắt đầu chuẩn bị đơn hàng từ bảng', '2026-04-17 12:41:13.275249+00', '2026-05-22'),
	('8b8b79e8-bd6c-41d0-85f3-b20234f76ae2', '3459b69a-2e3c-47bc-855f-8f244fc2a865', '2026-05-08 09:25:55.403543+00', 'cancelled', 40000.00, 'Địa Chỉ Giao Hàng', 15000.00, NULL, '2026-05-08 09:25:55.403543+00', NULL),
	('5525aa0f-2ea1-403a-b2ca-3fecfcbbc299', '3459b69a-2e3c-47bc-855f-8f244fc2a865', '2026-04-10 10:13:01.004371+00', 'cancelled', 427500.00, 'Địa Chỉ Giao Hàng', 15000.00, NULL, '2026-04-10 10:13:01.004371+00', NULL),
	('4bc8234a-176a-4478-a2e3-8c2e21c2c715', '3459b69a-2e3c-47bc-855f-8f244fc2a865', '2026-05-24 07:34:20.762242+00', 'confirmed', 385000.00, 'Địa Chỉ Giao Hàng', 15000.00, NULL, '2026-05-24 07:34:20.762242+00', NULL),
	('10fe82df-dd49-4375-ac1d-079b1c29365a', '3459b69a-2e3c-47bc-855f-8f244fc2a865', '2026-05-24 09:43:51.484004+00', 'confirmed', 385000.00, 'Địa Chỉ Giao Hàng', 15000.00, NULL, '2026-05-24 09:43:51.484004+00', NULL),
	('ffe33932-6e0f-46b9-8150-f96faaa3d7c3', '3459b69a-2e3c-47bc-855f-8f244fc2a865', '2026-06-04 15:22:58.055884+00', 'confirmed', 315000.00, 'Địa Chỉ Giao Hàng', 15000.00, NULL, '2026-06-04 15:22:58.055884+00', NULL),
	('45c7a4ac-3b32-44c7-8731-e7ca6ae460ad', '3459b69a-2e3c-47bc-855f-8f244fc2a865', '2026-05-08 09:25:37.472142+00', 'confirmed', 40000.00, 'Địa Chỉ Giao Hàng', 15000.00, NULL, '2026-05-08 09:25:37.472142+00', NULL),
	('55225edf-706d-4b37-8a0a-5ba8d448068e', 'cd1e5410-5d6f-42e4-b7a7-41e66766aae3', '2026-05-13 15:11:42.8881+00', 'cancelled', 350000.00, 'Địa chỉ mới!', 15000.00, NULL, '2026-05-13 15:11:42.8881+00', NULL),
	('f41dcae0-f332-4b74-9c9c-3e3d76480408', '3459b69a-2e3c-47bc-855f-8f244fc2a865', '2026-06-04 16:23:33.857393+00', 'confirmed', 140000.00, 'Địa Chỉ Giao Hàng', 15000.00, NULL, '2026-06-04 16:23:33.857393+00', NULL),
	('e5a4a15e-7260-48ca-80f7-933c0b0e93f8', '3459b69a-2e3c-47bc-855f-8f244fc2a865', '2026-06-09 08:23:11.146031+00', 'pending', 200000.00, 'Địa Chỉ Giao Hàng', 15000.00, NULL, '2026-06-09 08:23:11.146031+00', NULL),
	('a265ab7f-3bff-4a0b-8fde-c80682941ddc', 'f374c5bf-ed02-4793-bbd8-dae9ca816a36', '2026-06-11 07:58:32.565753+00', 'pending', 165000.00, 'Đây là địa chỉ nhập Test', 15000.00, NULL, '2026-06-11 07:58:32.565753+00', NULL),
	('a8b0ca65-495d-44c1-a199-2d32149142da', 'f374c5bf-ed02-4793-bbd8-dae9ca816a36', '2026-06-11 07:59:42.888691+00', 'pending', 570000.00, 'Đây là địa chỉ nhập Test', 15000.00, NULL, '2026-06-11 07:59:42.888691+00', NULL),
	('43a1194c-02c5-43b0-a25f-55a2e5e0b5df', 'f374c5bf-ed02-4793-bbd8-dae9ca816a36', '2026-06-11 08:06:23.624232+00', 'pending', 165000.00, 'Đây là địa chỉ nhập Test', 15000.00, NULL, '2026-06-11 08:06:23.624232+00', NULL),
	('9100c512-f65b-4954-a53c-cb7a0ba45ab3', 'f374c5bf-ed02-4793-bbd8-dae9ca816a36', '2026-06-11 08:27:03.847657+00', 'pending', 315000.00, 'Đây là địa chỉ nhập Test', 15000.00, NULL, '2026-06-11 08:27:03.847657+00', NULL),
	('10896977-dda9-4e5f-a192-eeb90337d756', 'f374c5bf-ed02-4793-bbd8-dae9ca816a36', '2026-06-11 08:31:58.574192+00', 'pending', 165000.00, 'Đây là địa chỉ nhập Test', 15000.00, NULL, '2026-06-11 08:31:58.574192+00', NULL),
	('bf62af3c-ab72-45f5-909e-d3021bf7b70f', 'f374c5bf-ed02-4793-bbd8-dae9ca816a36', '2026-06-11 08:41:16.306009+00', 'pending', 165000.00, 'Đây là địa chỉ nhập Test', 15000.00, NULL, '2026-06-11 08:41:16.306009+00', NULL),
	('46803505-1b85-4afc-8afa-dfb1c3a2f81e', 'f374c5bf-ed02-4793-bbd8-dae9ca816a36', '2026-06-11 08:42:35.0912+00', 'cancelled', 200000.00, 'Đây là địa chỉ nhập Test', 15000.00, NULL, '2026-06-11 08:42:35.0912+00', NULL);


--
-- Data for Name: complaints; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."complaints" ("complaint_id", "user_id", "order_id", "type", "description", "status", "created_at", "resolved_at", "reject_reason") VALUES
	('410fbb45-b206-4ec6-b43f-f81c76c6ae23', '3459b69a-2e3c-47bc-855f-8f244fc2a865', '8db32567-04ff-4311-a900-054c41e2a569', 'Khiếu nại về giá', 'Giá không hợp lí', 'resolved', '2026-05-08 12:48:06.385177+00', '2026-05-08 12:52:26.185+00', NULL),
	('df2e4fba-d83e-4033-9107-e3127cdd1fd1', 'cd1e5410-5d6f-42e4-b7a7-41e66766aae3', '72816803-8fd2-46e2-93f2-bb84678640d8', 'quality', 'Test Phản Ánh', 'rejected', '2026-05-15 10:13:01.359545+00', '2026-05-15 10:49:28.185+00', 'Test Từ Chối'),
	('ad730158-14fb-4d68-a4c3-af0a012e93a8', '3459b69a-2e3c-47bc-855f-8f244fc2a865', '135bd383-393f-4614-bd3d-3b2b8292b36c', 'Khiếu nại về thời gian giao', 'Order giao trễ', 'rejected', '2026-05-08 12:47:28.020704+00', '2026-05-21 02:50:58.688+00', 'Test từ chối'),
	('a310694d-1fe5-4ce5-a58d-9ca21757276d', 'cd1e5410-5d6f-42e4-b7a7-41e66766aae3', '72816803-8fd2-46e2-93f2-bb84678640d8', 'damaged', 'Test Khiếu nại', 'pending', '2026-05-15 13:03:53.702485+00', NULL, 'Test từ chối'),
	('f2db6574-d65e-4ac2-a2dd-84990b50e0ce', '3459b69a-2e3c-47bc-855f-8f244fc2a865', '8db32567-04ff-4311-a900-054c41e2a569', 'quality', 'Khiếu nại kiểm thử', 'resolved', '2026-06-15 15:59:53.676986+00', '2026-06-15 16:00:07.749+00', NULL);


--
-- Data for Name: deliveries; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."deliveries" ("delivery_id", "order_id", "employee_id", "status", "pickup_time", "delivery_time", "note") VALUES
	('66f874d5-e414-4f96-95e2-7e905175bcdf', 'e2d17c93-3ded-4a01-80d2-dd117b791434', '8b0c62f9-fd18-4abb-90f8-fd336d0e3c99', 'delivering', '2026-04-26 15:58:17.008+00', NULL, 'test'),
	('089a6ca0-9c56-42d4-b905-e300eb507b6e', '72816803-8fd2-46e2-93f2-bb84678640d8', '8b0c62f9-fd18-4abb-90f8-fd336d0e3c99', 'delivered', '2026-05-15 10:10:42.761+00', '2026-05-15 10:11:19.397+00', NULL),
	('fcaa39c5-8a9e-4bea-bd4a-a5041f897f3c', '7a2c55d3-60b4-4c05-ba1f-fe8ad2f61aa3', '8b0c62f9-fd18-4abb-90f8-fd336d0e3c99', 'delivered', '2026-05-08 12:51:53.673+00', '2026-06-15 15:37:05.582+00', 'Đã giao'),
	('d7848424-0716-4a97-90e8-5dc4f0a8178a', '3a24f00e-c936-40bf-aa8d-c11f8d2e8075', '8b0c62f9-fd18-4abb-90f8-fd336d0e3c99', 'delivered', '2026-06-15 15:39:35.454+00', '2026-06-15 15:39:52.832+00', NULL),
	('2d55011d-2af6-4f17-887d-2b492c401ab3', '4c07473f-4926-4cef-adf0-2c69b8341e83', '8b0c62f9-fd18-4abb-90f8-fd336d0e3c99', 'delivered', '2026-05-21 03:30:33.018+00', '2026-06-15 15:49:55.478+00', NULL),
	('b6e6af90-b344-48f1-bb22-044998958f86', '8eefdb9d-d953-44ce-8ad6-b180ec09c70f', '8b0c62f9-fd18-4abb-90f8-fd336d0e3c99', 'delivered', '2026-05-08 10:35:24.443+00', '2026-06-15 15:50:32.54+00', NULL),
	('ec029d1c-0916-4857-8525-15dea3fdd9f8', '8db32567-04ff-4311-a900-054c41e2a569', '8b0c62f9-fd18-4abb-90f8-fd336d0e3c99', 'delivered', '2026-05-08 12:18:11.858+00', '2026-06-15 15:56:55.04+00', 'Giao hàng thành công');


--
-- Data for Name: group_buys; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: group_buy_members; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: inventory; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."inventory" ("inventory_id", "batch_id", "quantity_available", "quantity_reserved", "last_updated") VALUES
	('837dc886-b6a9-40d9-b011-08b74a86decb', 'bbbb0001-0000-0000-0000-000000000000', 500, 0, '2026-04-09 10:29:07.205015+00'),
	('80ff514f-1909-4635-add8-95adc0d1e4ab', 'bbbb0002-0000-0000-0000-000000000000', 200, 0, '2026-04-09 10:29:07.205015+00'),
	('27cdc026-1a91-495b-8dfc-157a6dd2cd1d', 'bbbb0003-0000-0000-0000-000000000000', 1000, 0, '2026-04-09 10:29:07.205015+00'),
	('7d78c7bd-9717-4411-a252-9bf27d8c8e73', 'bbbb0005-0000-0000-0000-000000000000', 5000, 0, '2026-04-09 10:29:07.205015+00'),
	('8c9785ce-be44-476f-8b41-d58d52ef09c3', 'bbbb0006-0000-0000-0000-000000000000', 150, 0, '2026-04-09 10:29:07.205015+00'),
	('af850e5a-9526-4fe6-9181-4f27f20084e1', 'bbbb0007-0000-0000-0000-000000000000', 100, 0, '2026-04-09 10:29:07.205015+00'),
	('f0575779-559f-4137-8a3a-640f49c09422', 'bbbb0008-0000-0000-0000-000000000000', 50, 0, '2026-04-09 10:29:07.205015+00'),
	('008da061-7fee-43e4-8d36-a92b3e71dd8c', 'bbbb0009-0000-0000-0000-000000000000', 400, 0, '2026-04-09 10:29:07.205015+00'),
	('934ee7c2-1c1e-4ec9-95bc-043b4332f6ca', 'bbbb0010-0000-0000-0000-000000000000', 200, 0, '2026-04-09 10:29:07.205015+00'),
	('4497878a-a241-4ef3-981c-96324a5f042b', 'bbbb0011-0000-0000-0000-000000000000', 600, 0, '2026-04-09 10:29:07.205015+00'),
	('c04928f7-3998-4896-9fe2-caf4e4933d7b', 'bbbb0012-0000-0000-0000-000000000000', 800, 0, '2026-04-09 10:29:07.205015+00'),
	('bdc8d66c-17d8-45ea-9a05-cd44664ac747', 'bbbb0013-0000-0000-0000-000000000000', 150, 0, '2026-04-09 10:29:07.205015+00'),
	('b9fc8670-ec59-4119-a82a-7f84c36d9ec0', 'bbbb0015-0000-0000-0000-000000000000', 120, 0, '2026-04-09 10:29:07.205015+00'),
	('ad7a3629-bda5-4775-af95-2cd060557e08', 'bbbb0016-0000-0000-0000-000000000000', 80, 0, '2026-04-09 10:29:07.205015+00'),
	('cabbfe07-6547-4991-a1ac-30dbfcd32b2c', 'bbbb0018-0000-0000-0000-000000000000', 500, 0, '2026-04-09 10:29:07.205015+00'),
	('42a4fab9-d2e1-4cb5-9bc1-df7d4d4bf337', 'e400cb46-85b4-46c2-b2dc-4a4c3782fb4f', 399, 0, '2026-05-08 12:18:12.31+00'),
	('6ee1bf05-7a53-4b86-ad95-545d4c4e0b2b', 'c0b463d1-af22-45b0-b135-8c276a00e114', 500, 0, '2026-05-20 18:46:25.025+00'),
	('43c92b8a-327e-4def-a3fa-f7b4fcb79930', '4394e952-4426-4f42-b4a5-27603131e186', 496, 0, '2026-05-21 03:30:33.253+00'),
	('babf039d-b508-40bd-b00a-13cf71597cb3', 'cbb8c396-f4f8-4fbd-839a-b5f520f85307', 499, 0, '2026-06-15 15:39:35.984+00'),
	('eb7b56f7-1add-4daa-8a6b-0bf8b9016105', 'bbbb0004-0000-0000-0000-000000000000', 298, 0, '2026-06-15 15:39:36.449+00'),
	('7beeff50-12ec-4ebe-b045-1d34ad2d5a9e', 'bbbb0017-0000-0000-0000-000000000000', 244, 0, '2026-06-15 15:39:36.838+00'),
	('3917ba0b-c293-4bd3-975d-16969a1fe45f', 'bbbb0014-0000-0000-0000-000000000000', 299, 0, '2026-06-15 15:39:37.279+00');


--
-- Data for Name: inventory_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."inventory_transactions" ("transaction_id", "batch_id", "type", "quantity", "note", "created_at") VALUES
	('36703be9-ad0e-485e-96a3-db5862fdbf69', '4394e952-4426-4f42-b4a5-27603131e186', 'stock_out', 3, 'Order 4c07473f-4926-4cef-adf0-2c69b8341e83: Bắt đầu giao hàng', '2026-05-21 03:30:33.572091+00'),
	('d8b10592-cc9f-4a37-9b86-ffa1a15563dc', 'cbb8c396-f4f8-4fbd-839a-b5f520f85307', 'stock_in', 500, 'Nhập từ Lô hàng', '2026-05-22 12:47:17.74271+00'),
	('ce0c31cf-8321-4dde-9673-9c36e99cf54d', 'cbb8c396-f4f8-4fbd-839a-b5f520f85307', 'stock_out', 1, 'Order 3a24f00e-c936-40bf-aa8d-c11f8d2e8075: Bắt đầu giao hàng', '2026-06-15 15:39:36.556703+00'),
	('30649690-f5a2-4d0a-a8c6-ad0cbe5cf896', 'bbbb0004-0000-0000-0000-000000000000', 'stock_out', 1, 'Order 3a24f00e-c936-40bf-aa8d-c11f8d2e8075: Bắt đầu giao hàng', '2026-06-15 15:39:36.974904+00'),
	('149cd356-d7e1-49a6-9836-66d0ed6007c7', 'bbbb0001-0000-0000-0000-000000000000', 'stock_in', 500, 'Nhập kho lô kẹo dừa', '2026-04-09 10:29:13.229205+00'),
	('aacf6255-41e4-4515-985b-11e9a62c0e42', 'bbbb0002-0000-0000-0000-000000000000', 'stock_in', 200, 'Nhập kho yến mạch', '2026-04-09 10:29:13.229205+00'),
	('979f661d-318e-4f88-b991-84931232f12e', 'bbbb0003-0000-0000-0000-000000000000', 'stock_in', 1000, 'Nhập kho nước mắm', '2026-04-09 10:29:13.229205+00'),
	('073f49ed-3f7d-4033-8fd4-3e1a53a12b99', 'bbbb0004-0000-0000-0000-000000000000', 'stock_in', 300, 'Nhập kho bia Heineken', '2026-04-09 10:29:13.229205+00'),
	('589e70f4-b8b5-4f3f-b937-bd837712b20a', 'bbbb0005-0000-0000-0000-000000000000', 'stock_in', 5000, 'Nhập kho nước LaVie', '2026-04-09 10:29:13.229205+00'),
	('855fd6ae-62e0-485d-a31e-24958c8c558d', 'bbbb0006-0000-0000-0000-000000000000', 'stock_in', 150, 'Nhập kho táo Fuji', '2026-04-09 10:29:13.229205+00'),
	('ba468da5-ec5c-440c-aa0d-5d3d657ae5bf', 'bbbb0007-0000-0000-0000-000000000000', 'stock_in', 100, 'Nhập kho mứt dâu', '2026-04-09 10:29:13.229205+00'),
	('451aac71-69c0-409b-9a47-814f7fcd74b5', 'bbbb0008-0000-0000-0000-000000000000', 'stock_in', 50, 'Nhập kho thịt ba chỉ', '2026-04-09 10:29:13.229205+00'),
	('9eb8369d-f2f9-4e01-aa5b-b0bde0f10ee5', 'bbbb0009-0000-0000-0000-000000000000', 'stock_in', 400, 'Nhập kho mì Hảo Hảo', '2026-04-09 10:29:13.229205+00'),
	('01f9f828-69cf-4818-a8fd-16c9618d5591', 'bbbb0010-0000-0000-0000-000000000000', 'stock_in', 200, 'Nhập kho dầu ăn Simply', '2026-04-09 10:29:13.229205+00'),
	('5b34f721-ef97-4223-82df-e28f65300f7a', 'bbbb0011-0000-0000-0000-000000000000', 'stock_in', 600, 'Nhập kho tương ớt', '2026-04-09 10:29:13.229205+00'),
	('9e4fcd07-b061-466f-928b-e9b3ab45beb8', 'bbbb0012-0000-0000-0000-000000000000', 'stock_in', 800, 'Nhập kho xúc xích Vissan', '2026-04-09 10:29:13.229205+00'),
	('30949298-9f2c-4770-bc9d-f4111493d378', 'bbbb0013-0000-0000-0000-000000000000', 'stock_in', 150, 'Nhập kho socola Marou', '2026-04-09 10:29:13.229205+00'),
	('618dcd38-2bd2-4aaa-bcf9-121fd2a1f0db', 'bbbb0014-0000-0000-0000-000000000000', 'stock_in', 300, 'Nhập kho cà phê G7', '2026-04-09 10:29:13.229205+00'),
	('5642dd15-3499-4a6f-af64-8f8822181738', 'bbbb0015-0000-0000-0000-000000000000', 'stock_in', 120, 'Nhập kho nước rửa chén', '2026-04-09 10:29:13.229205+00'),
	('a3454f32-f1fa-4ba6-b3a4-78778ebe1de0', 'bbbb0016-0000-0000-0000-000000000000', 'stock_in', 80, 'Nhập kho cải thìa', '2026-04-09 10:29:13.229205+00'),
	('f755e9d9-3927-439c-bc59-34ddb3c54bf3', 'bbbb0017-0000-0000-0000-000000000000', 'stock_in', 250, 'Nhập kho bánh Danisa', '2026-04-09 10:29:13.229205+00'),
	('0ff71183-70fd-460b-8b50-b328a6c43997', 'bbbb0018-0000-0000-0000-000000000000', 'stock_in', 500, 'Nhập kho sữa TH True Milk', '2026-04-09 10:29:13.229205+00'),
	('71344dfe-69e9-4e11-9247-58ac792acb06', 'bbbb0017-0000-0000-0000-000000000000', 'stock_out', 1, 'Order 3a24f00e-c936-40bf-aa8d-c11f8d2e8075: Bắt đầu giao hàng', '2026-06-15 15:39:37.403886+00'),
	('724e8fc4-d7bf-4970-a242-e7f4417a88d6', 'bbbb0014-0000-0000-0000-000000000000', 'stock_out', 1, 'Order 3a24f00e-c936-40bf-aa8d-c11f8d2e8075: Bắt đầu giao hàng', '2026-06-15 15:39:37.815445+00'),
	('15bd8e09-994c-4bbb-91c2-83f19909c799', 'c0b463d1-af22-45b0-b135-8c276a00e114', 'stock_in', 500, 'Nhập kho', '2026-04-24 13:01:04.26483+00'),
	('95f7f3a6-62d3-4200-98bc-cee322155b28', 'c0b463d1-af22-45b0-b135-8c276a00e114', 'stock_in', 500, 'Nhập kho', '2026-04-24 13:00:17.6978+00'),
	('9cb9ce60-dc71-4f84-8b8e-aaf02d246ab2', '4394e952-4426-4f42-b4a5-27603131e186', 'stock_in', 500, 'Nhập kho', '2026-05-08 12:07:39.097596+00'),
	('7514a2a1-3885-4e11-8b48-e15e8942afb0', 'e400cb46-85b4-46c2-b2dc-4a4c3782fb4f', 'stock_in', 400, 'Nhập kho', '2026-04-24 10:06:56.90863+00'),
	('85c5a73b-3afd-4462-9168-afba0f9e0c98', 'e400cb46-85b4-46c2-b2dc-4a4c3782fb4f', 'stock_out', 1, 'Order 8db32567-04ff-4311-a900-054c41e2a569: Bắt đầu giao hàng', '2026-05-08 12:18:12.454736+00'),
	('8fc9df94-2a09-4454-9daa-0b22f51bdd10', 'bbbb0017-0000-0000-0000-000000000000', 'stock_out', 1, 'Order 7a2c55d3-60b4-4c05-ba1f-fe8ad2f61aa3: Giao hàng', '2026-05-08 12:51:56.746834+00'),
	('25ec3049-71e1-463d-b841-801959296b2d', '4394e952-4426-4f42-b4a5-27603131e186', 'stock_out', 1, 'Order 72816803-8fd2-46e2-93f2-bb84678640d8: sadsadsadsafdasf', '2026-05-15 10:10:43.075944+00'),
	('f346ad50-967d-4951-b643-9c2421335c1c', 'bbbb0017-0000-0000-0000-000000000000', 'stock_out', 2, 'Order 72816803-8fd2-46e2-93f2-bb84678640d8: sadsadsadsafdasf', '2026-05-15 10:10:43.35944+00');


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."order_items" ("order_item_id", "order_id", "product_id", "batch_id", "quantity", "price", "note") VALUES
	('7979ab2e-9f42-41f4-b16c-50d90cf4d405', 'e2d17c93-3ded-4a01-80d2-dd117b791434', 'aaaa0004-0000-0000-0000-000000000000', 'bbbb0004-0000-0000-0000-000000000000', 1, 19500.00, NULL),
	('a49887d7-f7b9-49a3-9829-a23feed5095c', '12d452c6-c10b-4f98-a0bb-a5c4dcf17d14', 'aaaa0004-0000-0000-0000-000000000000', 'bbbb0004-0000-0000-0000-000000000000', 10, 19500.00, NULL),
	('cdb495e5-46bf-42d2-9500-82b0dbda6cf3', '94cabf76-e9d4-43e2-a27a-82cfb9f93533', 'aaaa0017-0000-0000-0000-000000000000', 'bbbb0017-0000-0000-0000-000000000000', 1, 185000.00, NULL),
	('b095f972-514f-400c-9189-407ebc878931', '135bd383-393f-4614-bd3d-3b2b8292b36c', 'aaaa0002-0000-0000-0000-000000000000', 'bbbb0002-0000-0000-0000-000000000000', 2, 150000.00, NULL),
	('1fa21b25-dac6-49a7-8922-7048f500d90d', '3e6f9fc7-1830-4d02-907a-59b7191c2e2e', 'aaaa0002-0000-0000-0000-000000000000', 'bbbb0002-0000-0000-0000-000000000000', 1, 150000.00, NULL),
	('f7136876-2ed3-41b2-8cde-9961f16ce04f', '3e6f9fc7-1830-4d02-907a-59b7191c2e2e', 'aaaa0008-0000-0000-0000-000000000000', 'bbbb0008-0000-0000-0000-000000000000', 1, 150000.00, NULL),
	('c8779458-c4d3-4417-b9d9-d04554b9f1e6', '3e6f9fc7-1830-4d02-907a-59b7191c2e2e', 'aaaa0017-0000-0000-0000-000000000000', 'bbbb0017-0000-0000-0000-000000000000', 2, 185000.00, NULL),
	('f2050f7f-2122-4379-988e-3d69c7578c63', '5525aa0f-2ea1-403a-b2ca-3fecfcbbc299', 'aaaa0002-0000-0000-0000-000000000000', 'bbbb0002-0000-0000-0000-000000000000', 1, 150000.00, NULL),
	('a55ae9a1-9693-4e73-b3ae-ac600b6d3d8f', '5525aa0f-2ea1-403a-b2ca-3fecfcbbc299', 'aaaa0017-0000-0000-0000-000000000000', 'bbbb0017-0000-0000-0000-000000000000', 1, 185000.00, NULL),
	('a659d859-9797-4ec3-b33c-297a75aa2d82', '5525aa0f-2ea1-403a-b2ca-3fecfcbbc299', 'aaaa0004-0000-0000-0000-000000000000', 'bbbb0004-0000-0000-0000-000000000000', 1, 19500.00, NULL),
	('0492d5bc-52c1-41ad-960c-0483b1527a1f', '5525aa0f-2ea1-403a-b2ca-3fecfcbbc299', 'aaaa0014-0000-0000-0000-000000000000', 'bbbb0014-0000-0000-0000-000000000000', 1, 58000.00, NULL),
	('8107dd23-7510-4088-a742-a837cc729c51', 'a7738187-d043-4389-8c93-11219e91f6f9', 'aaaa0017-0000-0000-0000-000000000000', 'bbbb0017-0000-0000-0000-000000000000', 1, 185000.00, NULL),
	('252c5b27-e6c3-4eba-8371-c6d8d874a836', 'a7738187-d043-4389-8c93-11219e91f6f9', 'aaaa0002-0000-0000-0000-000000000000', 'bbbb0002-0000-0000-0000-000000000000', 2, 150000.00, NULL),
	('ea93c522-97fd-433c-a396-9dd02ea1ad73', '45c7a4ac-3b32-44c7-8731-e7ca6ae460ad', 'aaaa0016-0000-0000-0000-000000000000', 'e400cb46-85b4-46c2-b2dc-4a4c3782fb4f', 1, 25000.00, NULL),
	('a507efdd-c595-4cc5-bee8-cb4401ace67f', '8b8b79e8-bd6c-41d0-85f3-b20234f76ae2', 'aaaa0016-0000-0000-0000-000000000000', 'e400cb46-85b4-46c2-b2dc-4a4c3782fb4f', 1, 25000.00, NULL),
	('c3f64eb3-305f-4aaf-866b-f490e43b45c9', '8db32567-04ff-4311-a900-054c41e2a569', 'aaaa0016-0000-0000-0000-000000000000', 'e400cb46-85b4-46c2-b2dc-4a4c3782fb4f', 1, 25000.00, NULL),
	('a4eb00fb-3ae8-4d73-ba9a-df4d8dc26206', '8eefdb9d-d953-44ce-8ad6-b180ec09c70f', 'aaaa0017-0000-0000-0000-000000000000', 'bbbb0017-0000-0000-0000-000000000000', 2, 185000.00, NULL),
	('e3c0e90e-c277-4da5-811e-1be9eb8d62df', '7a2c55d3-60b4-4c05-ba1f-fe8ad2f61aa3', 'aaaa0017-0000-0000-0000-000000000000', 'bbbb0017-0000-0000-0000-000000000000', 1, 185000.00, NULL),
	('f4823082-0d9b-44bd-9670-eeff8a9586a3', '4c07473f-4926-4cef-adf0-2c69b8341e83', 'aaaa0002-0000-0000-0000-000000000000', '4394e952-4426-4f42-b4a5-27603131e186', 3, 150000.00, NULL),
	('9ecbe093-d488-40a5-af36-7cef9c70a903', '72816803-8fd2-46e2-93f2-bb84678640d8', 'aaaa0002-0000-0000-0000-000000000000', '4394e952-4426-4f42-b4a5-27603131e186', 1, 150000.00, NULL),
	('e6c2737b-3ac6-4df5-b321-e632f610a577', '72816803-8fd2-46e2-93f2-bb84678640d8', 'aaaa0017-0000-0000-0000-000000000000', 'bbbb0017-0000-0000-0000-000000000000', 2, 185000.00, NULL),
	('d27c6394-a8a3-4d1e-916c-6fdcb7d983be', '55225edf-706d-4b37-8a0a-5ba8d448068e', 'aaaa0002-0000-0000-0000-000000000000', '4394e952-4426-4f42-b4a5-27603131e186', 1, 150000.00, NULL),
	('a6b81fd7-f44a-4531-85c7-bca4ee236fd2', '55225edf-706d-4b37-8a0a-5ba8d448068e', 'aaaa0017-0000-0000-0000-000000000000', 'bbbb0017-0000-0000-0000-000000000000', 1, 185000.00, NULL),
	('5cb5b5b5-badd-4f1c-98f2-d5f3ab3a333b', '4bc8234a-176a-4478-a2e3-8c2e21c2c715', 'aaaa0017-0000-0000-0000-000000000000', 'bbbb0017-0000-0000-0000-000000000000', 2, 185000.00, NULL),
	('5afc0ad8-6088-47cc-b0f4-fe5077dfdae2', '10fe82df-dd49-4375-ac1d-079b1c29365a', 'aaaa0017-0000-0000-0000-000000000000', 'bbbb0017-0000-0000-0000-000000000000', 2, 185000.00, NULL),
	('a0263614-25a2-4f4a-9d46-d92660d5b77f', 'ffe33932-6e0f-46b9-8150-f96faaa3d7c3', 'aaaa0002-0000-0000-0000-000000000000', 'cbb8c396-f4f8-4fbd-839a-b5f520f85307', 2, 150000.00, NULL),
	('6651cdc9-020a-4fbd-b080-2369ea13251b', 'f41dcae0-f332-4b74-9c9c-3e3d76480408', 'aaaa0015-0000-0000-0000-000000000000', 'bbbb0015-0000-0000-0000-000000000000', 1, 125000.00, NULL),
	('b118f980-53a9-4bb4-aa98-715cba289082', 'e5a4a15e-7260-48ca-80f7-933c0b0e93f8', 'aaaa0017-0000-0000-0000-000000000000', 'bbbb0017-0000-0000-0000-000000000000', 1, 185000.00, NULL),
	('39c771fc-a521-40e2-afe3-bdb7925dddb7', 'a265ab7f-3bff-4a0b-8fde-c80682941ddc', 'aaaa0002-0000-0000-0000-000000000000', 'cbb8c396-f4f8-4fbd-839a-b5f520f85307', 1, 150000.00, NULL),
	('75293fdd-6650-4ac1-9d26-c139d3f6d1ed', 'a8b0ca65-495d-44c1-a199-2d32149142da', 'aaaa0017-0000-0000-0000-000000000000', 'bbbb0017-0000-0000-0000-000000000000', 3, 185000.00, NULL),
	('7bf71140-8072-46f7-81cb-37a45de1ff29', '43a1194c-02c5-43b0-a25f-55a2e5e0b5df', 'aaaa0002-0000-0000-0000-000000000000', 'cbb8c396-f4f8-4fbd-839a-b5f520f85307', 1, 150000.00, NULL),
	('aa9f7eff-a2ec-4d61-9d8b-b2b7bdbd55a0', '9100c512-f65b-4954-a53c-cb7a0ba45ab3', 'aaaa0002-0000-0000-0000-000000000000', 'cbb8c396-f4f8-4fbd-839a-b5f520f85307', 2, 150000.00, NULL),
	('ad47ea39-44c0-4125-9b88-20a86a6035a1', '10896977-dda9-4e5f-a192-eeb90337d756', 'aaaa0002-0000-0000-0000-000000000000', 'cbb8c396-f4f8-4fbd-839a-b5f520f85307', 1, 150000.00, NULL),
	('df8dff44-3d74-42e0-b35d-76a03e1fbc9d', 'bf62af3c-ab72-45f5-909e-d3021bf7b70f', 'aaaa0002-0000-0000-0000-000000000000', 'cbb8c396-f4f8-4fbd-839a-b5f520f85307', 1, 150000.00, NULL),
	('8dbf60ac-8160-4d5f-8d4d-a3160dd338ec', '46803505-1b85-4afc-8afa-dfb1c3a2f81e', 'aaaa0017-0000-0000-0000-000000000000', 'bbbb0017-0000-0000-0000-000000000000', 1, 185000.00, NULL),
	('762b34fe-2723-41cc-b027-2f77df13f0fd', '3a24f00e-c936-40bf-aa8d-c11f8d2e8075', 'aaaa0002-0000-0000-0000-000000000000', 'cbb8c396-f4f8-4fbd-839a-b5f520f85307', 1, 150000.00, 'Kiểm tra thêm ghi chú'),
	('1f85cc64-9fe4-400b-840c-c7323ecf3d09', '3a24f00e-c936-40bf-aa8d-c11f8d2e8075', 'aaaa0004-0000-0000-0000-000000000000', 'bbbb0004-0000-0000-0000-000000000000', 1, 19500.00, 'Kiểm tra thêm ghi chú'),
	('19ee7a66-a8c7-4ea1-9df5-17c1cae0195b', '3a24f00e-c936-40bf-aa8d-c11f8d2e8075', 'aaaa0017-0000-0000-0000-000000000000', 'bbbb0017-0000-0000-0000-000000000000', 1, 185000.00, 'Kiểm tra thêm ghi chú'),
	('81d11a06-ca18-4c5b-90ae-ea20babc7b83', '3a24f00e-c936-40bf-aa8d-c11f8d2e8075', 'aaaa0014-0000-0000-0000-000000000000', 'bbbb0014-0000-0000-0000-000000000000', 1, 58000.00, 'Kiểm tra thêm ghi chú');


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."payments" ("payment_id", "order_id", "method", "status", "amount", "transaction_id", "payment_date") VALUES
	('10afd068-5457-439d-9d8f-be81509d38b4', '94cabf76-e9d4-43e2-a27a-82cfb9f93533', 'cod', 'pending', 200000.00, NULL, NULL),
	('52448433-8dce-4a59-bbf0-dd15e6d949b0', '135bd383-393f-4614-bd3d-3b2b8292b36c', 'cod', 'pending', 315000.00, NULL, NULL),
	('befdd5c6-d451-4d1f-b1a5-f9e279fcdd20', '3e6f9fc7-1830-4d02-907a-59b7191c2e2e', 'cod', 'pending', 685000.00, NULL, NULL),
	('286598b8-28f9-4b2c-a333-b61343d3366b', 'a7738187-d043-4389-8c93-11219e91f6f9', 'cod', 'paid', 500000.00, NULL, '2026-04-17 12:41:53.215+00'),
	('cad0cc52-b90d-41ca-bff4-36e1d2813f1b', '8eefdb9d-d953-44ce-8ad6-b180ec09c70f', 'cod', 'paid', 385000.00, NULL, '2026-05-08 10:30:43.207+00'),
	('950702d4-9ff5-423e-a4c6-405e65948c49', '7a2c55d3-60b4-4c05-ba1f-fe8ad2f61aa3', 'cod', 'paid', 200000.00, NULL, '2026-05-08 12:51:18.711+00'),
	('13d5c5c3-b278-4307-828a-ed5824eb4264', '4c07473f-4926-4cef-adf0-2c69b8341e83', 'cod', 'paid', 465000.00, NULL, '2026-05-13 15:09:47.804+00'),
	('1265c08c-0f1c-4b34-bac0-e5723f17b0fe', '72816803-8fd2-46e2-93f2-bb84678640d8', 'cod', 'paid', 535000.00, NULL, '2026-05-13 15:10:32.897+00'),
	('1199cdb1-3686-4881-bada-f6cb82b56d71', '55225edf-706d-4b37-8a0a-5ba8d448068e', 'cod', 'failed', 350000.00, NULL, NULL),
	('d9933d47-90f3-484a-a05f-079c537b29ab', '5525aa0f-2ea1-403a-b2ca-3fecfcbbc299', 'cod', 'failed', 427500.00, NULL, NULL),
	('3a3ba0e7-ad87-4d47-809c-e8b5752b1e79', '4bc8234a-176a-4478-a2e3-8c2e21c2c715', 'cod', 'paid', 385000.00, NULL, '2026-05-24 07:34:48.574+00'),
	('9519472c-0180-46ed-ac1a-431703c656c6', '12d452c6-c10b-4f98-a0bb-a5c4dcf17d14', 'cod', 'failed', 210000.00, NULL, NULL),
	('c4f91dad-dc13-4d6b-98ad-207478bd82e7', '10fe82df-dd49-4375-ac1d-079b1c29365a', 'cod', 'paid', 385000.00, NULL, '2026-06-04 15:22:13.669+00'),
	('ee6a8d27-9d1c-4f63-b34e-68a5a10be05c', 'ffe33932-6e0f-46b9-8150-f96faaa3d7c3', 'cod', 'paid', 315000.00, NULL, '2026-06-04 15:56:21.078+00'),
	('af9733bd-beaa-4242-9197-606dc402db9a', 'f41dcae0-f332-4b74-9c9c-3e3d76480408', 'cod', 'paid', 140000.00, NULL, '2026-06-04 16:23:44.818+00'),
	('ed8bc456-f11d-4473-9c8d-a9efc10a370e', 'e5a4a15e-7260-48ca-80f7-933c0b0e93f8', 'cod', 'pending', 200000.00, NULL, NULL),
	('a86635eb-4a60-425b-abd0-2841a2565d3e', 'a265ab7f-3bff-4a0b-8fde-c80682941ddc', 'cod', 'pending', 165000.00, NULL, NULL),
	('710b92e5-907d-4466-aa57-db4e7ddc7e05', 'a8b0ca65-495d-44c1-a199-2d32149142da', 'cod', 'pending', 570000.00, NULL, NULL),
	('bdf394f4-45fc-48a2-94ec-0392bb242f77', '43a1194c-02c5-43b0-a25f-55a2e5e0b5df', 'cod', 'pending', 165000.00, NULL, NULL),
	('782107b4-dad6-47fd-8a06-ecddc0ec7192', '9100c512-f65b-4954-a53c-cb7a0ba45ab3', 'cod', 'pending', 315000.00, NULL, NULL),
	('769ba909-0386-442a-b5e9-44f322e2f49d', '10896977-dda9-4e5f-a192-eeb90337d756', 'cod', 'pending', 165000.00, NULL, NULL),
	('fab3a344-c888-4059-913b-60c022ed13ab', 'bf62af3c-ab72-45f5-909e-d3021bf7b70f', 'cod', 'pending', 165000.00, NULL, NULL),
	('114ecc07-5015-4b58-bae0-c6fe84c41e34', '3a24f00e-c936-40bf-aa8d-c11f8d2e8075', 'cod', 'paid', 427500.00, NULL, '2026-06-11 10:14:42.427+00'),
	('50e0a20d-8f89-4cb8-9ee4-0dfb979f78ce', '46803505-1b85-4afc-8afa-dfb1c3a2f81e', 'cod', 'failed', 200000.00, NULL, NULL);


--
-- Data for Name: posts; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."posts" ("post_id", "user_id", "title", "content", "type", "status", "created_at") VALUES
	('f176e89b-cd2b-40cd-a78d-20a1fe254616', '3459b69a-2e3c-47bc-855f-8f244fc2a865', 'Kiểm tra đăng', 'Bài đăng', 'blog', 'approved', '2026-04-17 12:44:17.3206+00'),
	('51fc0771-2fbb-4a98-85ee-8f830eba0515', 'f374c5bf-ed02-4793-bbd8-dae9ca816a36', 'Các món liên quan đến Gà!', 'Gà rất ngon!', 'blog', 'rejected', '2026-06-11 10:16:16.691674+00'),
	('76031dc7-efbd-420d-8033-41e17915c17d', '72c0105f-724a-49f6-a47f-0528118b5361', 'Tiêu đề bài viết', 'Nội dung bài viết', 'blog', 'rejected', '2026-05-24 14:53:25.509118+00'),
	('78a31f4e-20bc-4219-a815-60acd9c09762', '6bd2f08a-3cfb-49b1-b07f-05fe031ce589', 'Kiểm tra đăng nhiều ảnh!', 'Nhiều ảnh!', 'blog', 'approved', '2026-04-10 10:09:19.384989+00'),
	('e71eedb9-a2ba-42d3-ad5a-84ade4058f5b', '6bd2f08a-3cfb-49b1-b07f-05fe031ce589', 'Kiểm tra đăng Text Post!', 'Xin chào, tôi là Text Post!', 'community', 'approved', '2026-04-10 10:10:39.961017+00'),
	('4a6231f9-1c67-4f26-9a02-59c4e32a1ae5', 'b965bce8-faac-41f7-9630-b4a4d6754773', 'Đăng Video 1', 'Kiểm thử đăng Video!', 'video', 'pending', '2026-04-10 10:05:30.804938+00'),
	('001ec22a-e813-4aa9-8606-952e1f9de253', 'b965bce8-faac-41f7-9630-b4a4d6754773', 'Đăng 1 Ảnh', 'Kiểm tra đăng 1 ảnh!', 'blog', 'approved', '2026-04-10 10:05:54.962291+00'),
	('3ce27d0d-5ed7-4193-9021-e030f2348d21', '6bd2f08a-3cfb-49b1-b07f-05fe031ce589', 'Kiểm tra đăng video 2!', 'Đăng video 2!', 'video', 'approved', '2026-04-10 10:10:15.723496+00');


--
-- Data for Name: post_interactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."post_interactions" ("interaction_id", "post_id", "user_id", "type", "comment", "created_at", "status") VALUES
	('fd9c4ebc-33c7-46da-afb7-c46ba4059d09', '001ec22a-e813-4aa9-8606-952e1f9de253', 'b965bce8-faac-41f7-9630-b4a4d6754773', 'comment', 'Kiểm tra tự Comment!', '2026-04-10', 'active'),
	('f1737d9e-9e5e-4656-8690-b3e3c8185dee', '001ec22a-e813-4aa9-8606-952e1f9de253', 'b965bce8-faac-41f7-9630-b4a4d6754773', 'like', NULL, '2026-04-10', 'active'),
	('3ca237e7-4160-4bbc-8094-ae02e0ae7d73', '001ec22a-e813-4aa9-8606-952e1f9de253', '6bd2f08a-3cfb-49b1-b07f-05fe031ce589', 'comment', 'Kiểm tra đăng Comment trên Post khác!', '2026-04-10', 'active'),
	('f467b8c0-63d3-41a1-ac61-a76055ee09ff', '4a6231f9-1c67-4f26-9a02-59c4e32a1ae5', '6bd2f08a-3cfb-49b1-b07f-05fe031ce589', 'like', NULL, '2026-04-10', 'active'),
	('16bba2e1-eb31-42f2-908c-6a1c1e2ddfca', '001ec22a-e813-4aa9-8606-952e1f9de253', '6bd2f08a-3cfb-49b1-b07f-05fe031ce589', 'like', NULL, '2026-04-10', 'active'),
	('b921fdb3-3f9b-4507-816c-b68e7a95e228', '78a31f4e-20bc-4219-a815-60acd9c09762', '3459b69a-2e3c-47bc-855f-8f244fc2a865', 'like', NULL, '2026-04-10', 'active'),
	('8e24a4e4-6d33-437f-bc2d-41aeee894449', '001ec22a-e813-4aa9-8606-952e1f9de253', '3459b69a-2e3c-47bc-855f-8f244fc2a865', 'like', NULL, '2026-04-10', 'active'),
	('f69beff5-ec00-4651-aba9-5bc46ab719ce', '4a6231f9-1c67-4f26-9a02-59c4e32a1ae5', '3459b69a-2e3c-47bc-855f-8f244fc2a865', 'like', NULL, '2026-04-10', 'active'),
	('5b244fb5-bad6-41fe-b558-8a7b1f5515b2', 'e71eedb9-a2ba-42d3-ad5a-84ade4058f5b', '3459b69a-2e3c-47bc-855f-8f244fc2a865', 'bookmark', NULL, '2026-04-10', 'active'),
	('249a152a-99de-43cb-913d-250bd5edf2da', '3ce27d0d-5ed7-4193-9021-e030f2348d21', '3459b69a-2e3c-47bc-855f-8f244fc2a865', 'like', NULL, '2026-04-17', 'active'),
	('daeb8468-ed8d-4c25-97f3-5418bd5458f1', '3ce27d0d-5ed7-4193-9021-e030f2348d21', '3459b69a-2e3c-47bc-855f-8f244fc2a865', 'comment', 'Test Bình Luận', '2026-04-17', 'active'),
	('987105d3-1630-4779-8ad1-6460e1ac397f', '3ce27d0d-5ed7-4193-9021-e030f2348d21', '3459b69a-2e3c-47bc-855f-8f244fc2a865', 'bookmark', NULL, '2026-04-17', 'active'),
	('4c19fddc-d5fd-48a0-bf5e-3edf3f0d78dd', 'f176e89b-cd2b-40cd-a78d-20a1fe254616', 'cd1e5410-5d6f-42e4-b7a7-41e66766aae3', 'like', NULL, '2026-05-13', 'active'),
	('9abe3931-e459-4660-add5-a9fa80b7d72b', 'e71eedb9-a2ba-42d3-ad5a-84ade4058f5b', 'cd1e5410-5d6f-42e4-b7a7-41e66766aae3', 'comment', 'test bình luận', '2026-05-13', 'active'),
	('bfdefa3e-0dae-458e-9186-87d7fbea55b4', '3ce27d0d-5ed7-4193-9021-e030f2348d21', 'cd1e5410-5d6f-42e4-b7a7-41e66766aae3', 'bookmark', NULL, '2026-05-13', 'active'),
	('f72d30a9-d6eb-4d02-b1ea-5325d1ecf436', 'f176e89b-cd2b-40cd-a78d-20a1fe254616', 'cd1e5410-5d6f-42e4-b7a7-41e66766aae3', 'bookmark', NULL, '2026-05-13', 'active'),
	('d53fcc3b-b833-4e4a-bf3c-b6014e770f4c', 'f176e89b-cd2b-40cd-a78d-20a1fe254616', '3459b69a-2e3c-47bc-855f-8f244fc2a865', 'like', NULL, '2026-05-24', 'active'),
	('5a5ca36e-d968-4f3b-8bc3-ed68a13f958d', 'f176e89b-cd2b-40cd-a78d-20a1fe254616', '3459b69a-2e3c-47bc-855f-8f244fc2a865', 'bookmark', NULL, '2026-05-24', 'active'),
	('6651b6e4-0784-4a68-97db-f50773a457be', 'f176e89b-cd2b-40cd-a78d-20a1fe254616', '3459b69a-2e3c-47bc-855f-8f244fc2a865', 'comment', 'Đây là bình luận!', '2026-05-24', 'active'),
	('b92fee97-92da-4f1c-a420-b27db3d7405a', 'e71eedb9-a2ba-42d3-ad5a-84ade4058f5b', '3459b69a-2e3c-47bc-855f-8f244fc2a865', 'like', NULL, '2026-05-24', 'active'),
	('82d822e3-a9c6-4459-b4b7-bdf1f566137d', 'f176e89b-cd2b-40cd-a78d-20a1fe254616', '3459b69a-2e3c-47bc-855f-8f244fc2a865', 'comment', 'Đây là 1 bình luận!', '2026-05-24', 'active'),
	('4deb31b3-cbe5-4244-b8e4-f6a004f7eacb', '76031dc7-efbd-420d-8033-41e17915c17d', '3459b69a-2e3c-47bc-855f-8f244fc2a865', 'comment', 'who am i?', '2026-05-30', 'active');


--
-- Data for Name: post_medias; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."post_medias" ("media_id", "post_id", "media_url") VALUES
	('4cd51821-e3e4-4672-8ca7-a4ee4043f277', '4a6231f9-1c67-4f26-9a02-59c4e32a1ae5', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Post-Attachment/b965bce8-faac-41f7-9630-b4a4d6754773/4a6231f9-1c67-4f26-9a02-59c4e32a1ae5/1775815530794-d07be04601932.mp4'),
	('faec81f3-d898-4532-8fa3-293ef6940838', '001ec22a-e813-4aa9-8606-952e1f9de253', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Post-Attachment/b965bce8-faac-41f7-9630-b4a4d6754773/001ec22a-e813-4aa9-8606-952e1f9de253/1775815554646-63a349bb26f6d.jpg'),
	('947d6ec6-5e36-49d9-9c44-9e75fd595541', '78a31f4e-20bc-4219-a815-60acd9c09762', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Post-Attachment/6bd2f08a-3cfb-49b1-b07f-05fe031ce589/78a31f4e-20bc-4219-a815-60acd9c09762/1775815759002-4e689c691a934.png'),
	('42b59398-6c31-4210-8319-0d55e1dd0cce', '78a31f4e-20bc-4219-a815-60acd9c09762', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Post-Attachment/6bd2f08a-3cfb-49b1-b07f-05fe031ce589/78a31f4e-20bc-4219-a815-60acd9c09762/1775815759845-167164e2ab861.png'),
	('dd8919a1-65c1-48c2-8c97-a953345dc046', '78a31f4e-20bc-4219-a815-60acd9c09762', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Post-Attachment/6bd2f08a-3cfb-49b1-b07f-05fe031ce589/78a31f4e-20bc-4219-a815-60acd9c09762/1775815760406-5bf2d207d60d.png'),
	('2ff2fa2a-94ff-4124-93aa-625f05251b5c', '3ce27d0d-5ed7-4193-9021-e030f2348d21', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Post-Attachment/6bd2f08a-3cfb-49b1-b07f-05fe031ce589/3ce27d0d-5ed7-4193-9021-e030f2348d21/1775815815469-333508c0b2267.mp4'),
	('dca346c0-072b-4da5-8a87-2dfd8870bcf9', 'f176e89b-cd2b-40cd-a78d-20a1fe254616', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Post-Attachment/3459b69a-2e3c-47bc-855f-8f244fc2a865/f176e89b-cd2b-40cd-a78d-20a1fe254616/1776429858543-876221e79b2d.png'),
	('01f9a6df-d57a-425a-b8d6-62e7f4944521', '76031dc7-efbd-420d-8033-41e17915c17d', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Post-Attachment/72c0105f-724a-49f6-a47f-0528118b5361/76031dc7-efbd-420d-8033-41e17915c17d/1779634409525-54409c8998b15.png'),
	('0ea3e01f-d969-4660-a947-7de1c19bd8fe', '76031dc7-efbd-420d-8033-41e17915c17d', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Post-Attachment/72c0105f-724a-49f6-a47f-0528118b5361/76031dc7-efbd-420d-8033-41e17915c17d/1779634410602-83b94d7ed6275.png'),
	('33674615-41fb-4968-86f1-722a225d0055', '51fc0771-2fbb-4a98-85ee-8f830eba0515', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Post-Attachment/f374c5bf-ed02-4793-bbd8-dae9ca816a36/51fc0771-2fbb-4a98-85ee-8f830eba0515/1781172977773-237d3c9cc151d.png'),
	('21427451-26d8-462d-b2a4-d684cfa1c3eb', '51fc0771-2fbb-4a98-85ee-8f830eba0515', 'https://ujgnuwlljslwokblmrwi.supabase.co/storage/v1/object/public/Post-Attachment/f374c5bf-ed02-4793-bbd8-dae9ca816a36/51fc0771-2fbb-4a98-85ee-8f830eba0515/1781172979006-2fae1e820bd66.png');


--
-- Data for Name: prices; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."prices" ("price_id", "batch_id", "price", "date", "created_at", "status") VALUES
	('c55c690b-d28a-4478-93da-a14ebbdd16df', '8de6832c-4e68-45db-994b-3e00171554d5', 32000.00, '2026-05-01', '2026-06-11', 'active'),
	('4b23cf8e-a715-4ba2-910c-835861cbd2ea', '8991e267-fc41-4dc8-8049-18d209f21587', 38000.00, '2026-05-10', '2026-06-11', 'active'),
	('599a5283-ec67-4079-a536-dc45d470ad17', '0d3b1f08-5444-422e-b2a7-b5685190f47c', 25000.00, '2026-01-01', '2026-04-23', 'active'),
	('cccc0001-0000-0000-0000-000000000000', 'bbbb0001-0000-0000-0000-000000000000', 35000.00, '2026-04-09', '2026-04-23', 'active'),
	('cccc0002-0000-0000-0000-000000000000', 'bbbb0002-0000-0000-0000-000000000000', 150000.00, '2026-04-09', '2026-04-23', 'active'),
	('cccc0003-0000-0000-0000-000000000000', 'bbbb0003-0000-0000-0000-000000000000', 28000.00, '2026-04-09', '2026-04-23', 'active'),
	('cccc0004-0000-0000-0000-000000000000', 'bbbb0004-0000-0000-0000-000000000000', 19500.00, '2026-04-09', '2026-04-23', 'active'),
	('cccc0005-0000-0000-0000-000000000000', 'bbbb0005-0000-0000-0000-000000000000', 6000.00, '2026-04-09', '2026-04-23', 'active'),
	('cccc0006-0000-0000-0000-000000000000', 'bbbb0006-0000-0000-0000-000000000000', 85000.00, '2026-04-09', '2026-04-23', 'active'),
	('cccc0007-0000-0000-0000-000000000000', 'bbbb0007-0000-0000-0000-000000000000', 65000.00, '2026-04-09', '2026-04-23', 'active'),
	('cccc0008-0000-0000-0000-000000000000', 'bbbb0008-0000-0000-0000-000000000000', 150000.00, '2026-04-09', '2026-04-23', 'active'),
	('cccc0009-0000-0000-0000-000000000000', 'bbbb0009-0000-0000-0000-000000000000', 115000.00, '2026-04-09', '2026-04-23', 'active'),
	('cccc0010-0000-0000-0000-000000000000', 'bbbb0010-0000-0000-0000-000000000000', 62000.00, '2026-04-09', '2026-04-23', 'active'),
	('cccc0011-0000-0000-0000-000000000000', 'bbbb0011-0000-0000-0000-000000000000', 15000.00, '2026-04-09', '2026-04-23', 'active'),
	('cccc0012-0000-0000-0000-000000000000', 'bbbb0012-0000-0000-0000-000000000000', 42000.00, '2026-04-09', '2026-04-23', 'active'),
	('cccc0013-0000-0000-0000-000000000000', 'bbbb0013-0000-0000-0000-000000000000', 100000.00, '2026-04-09', '2026-04-23', 'active'),
	('cccc0014-0000-0000-0000-000000000000', 'bbbb0014-0000-0000-0000-000000000000', 58000.00, '2026-04-09', '2026-04-23', 'active'),
	('cccc0015-0000-0000-0000-000000000000', 'bbbb0015-0000-0000-0000-000000000000', 125000.00, '2026-04-09', '2026-04-23', 'active'),
	('cccc0016-0000-0000-0000-000000000000', 'bbbb0016-0000-0000-0000-000000000000', 25000.00, '2026-04-09', '2026-04-23', 'active'),
	('cccc0017-0000-0000-0000-000000000000', 'bbbb0017-0000-0000-0000-000000000000', 185000.00, '2026-04-09', '2026-04-23', 'active'),
	('cccc0018-0000-0000-0000-000000000000', 'bbbb0018-0000-0000-0000-000000000000', 35000.00, '2026-04-09', '2026-04-23', 'active'),
	('fa1dc95d-8bde-4f5b-829b-2c7c21e343ce', '7c0c5fb3-2b63-41ee-b9d2-8904665181ac', 35000.00, '2026-04-15', '2026-06-11', 'active'),
	('319be4e5-3a4f-4ccf-a8c2-7b095b7585ba', 'a238a29e-318a-4a2f-bdaf-3c9431a0ce2c', 15000.00, '2026-05-20', '2026-06-11', 'active'),
	('bb1423d0-0211-4ea2-8224-794ad9933cfc', '39fd094e-6ea6-42e0-b356-20fc1fd804d0', 20000.00, '2026-05-01', '2026-06-11', 'active'),
	('9727ab79-4386-46fd-8d1c-dd76b65f124b', '89026782-e396-4245-bf98-1628d6307dc4', 24000.00, '2026-05-05', '2026-06-11', 'active'),
	('b3d19fba-8c4f-4d42-b5c8-31a3de64ca48', 'bbbb0018-0000-0000-0000-000000000000', 40000.00, '2026-04-24', '2026-04-24', 'pending'),
	('4f972afe-5922-42d5-af0d-9128e4a32b73', '254b0ed1-af90-4b15-b8bf-6eccb8763319', 55000.00, '2026-04-01', '2026-06-11', 'active'),
	('05caa404-0b9e-4bb9-8c2e-8056a955d714', 'e592efcc-52a6-4260-ac8c-a8676833c488', 11000.00, '2026-05-12', '2026-06-11', 'active'),
	('6586accc-a76f-4766-a39b-05c2fc82032c', '8d97bb21-237a-4c0d-aebf-127db36715cd', 48000.00, '2026-05-15', '2026-06-11', 'active'),
	('00ee835f-ae4e-4012-a352-35506d7106dc', 'b1bcffd8-499e-4284-a35e-af87110f7cf4', 28000.00, '2026-05-10', '2026-06-11', 'active'),
	('eb5f1d66-2c1b-45e2-82b8-619b95427ec6', '6d900fc0-6c7f-4671-af3f-6da4289a3749', 50000.00, '2026-05-18', '2026-06-11', 'active'),
	('0a2e9de8-ef16-4053-9eb3-309c30b9e556', '96ba007e-ee71-4761-9230-f9088d21edcb', 68000.00, '2026-06-01', '2026-06-11', 'active'),
	('d3e6780b-c4bb-4a07-ad30-c6b32eb33797', '551576a5-7c59-4397-9223-6739cb8d2aa3', 16000.00, '2026-03-30', '2026-06-11', 'active'),
	('3d766544-30da-4e12-ab15-b13466b9b3f2', '0392bfda-d67e-4bae-8383-57d1354a3910', 17000.00, '2026-05-05', '2026-06-11', 'active'),
	('581618da-ee9e-45ad-a056-183305b23f50', '98407348-494a-4539-aa0f-57883a2eb386', 22000.00, '2026-04-20', '2026-06-11', 'active'),
	('e8b853a6-6332-4454-b5de-3e64950606bf', 'b2836a24-28c0-4c8e-a0e9-ed979a040027', 3000.00, '2026-05-10', '2026-06-11', 'active'),
	('59a8d9e1-8807-47ca-bae8-a9dd68dbee31', 'eaae07ac-cecd-4e2a-a946-da7519b08d23', 9000.00, '2026-04-07', '2026-06-11', 'active'),
	('bd327482-1641-474b-a4d2-d440ba743cc6', '8025140f-6667-4611-9cdc-7b46d9d47641', 10000.00, '2026-05-18', '2026-06-11', 'active'),
	('566dbce9-1ea9-47aa-a9c7-6bd0b60e4407', 'e02f7956-4259-4bd3-991c-46e252eb5d68', 10500.00, '2026-06-01', '2026-06-11', 'active'),
	('058d3ab0-9395-41ed-b2f0-10c233fa0596', '249c9a4c-c8b7-4598-a7e4-5160601b48da', 9000.00, '2026-05-25', '2026-06-11', 'active'),
	('76ab83c4-6743-48ce-ac72-f5387506c3d9', 'c479af39-5e16-4ae7-8215-a7054be03fec', 6500.00, '2026-06-10', '2026-06-11', 'active'),
	('39c129f6-8ec7-41a0-98b0-6122a0569471', 'a5dca023-34e8-430c-a7ff-26f154889040', 7000.00, '2026-03-25', '2026-06-11', 'active'),
	('a66ba2f9-9750-4b7c-8ec6-3533137bd830', 'bb839d8d-8b54-49bb-b2a8-5fc340229ed6', 45000.00, '2026-05-15', '2026-06-11', 'active'),
	('85d3c6dd-ae8e-4f33-8056-3a51170863e2', 'ebe6b1ad-754c-4d32-8819-e2edbc74f9c4', 16000.00, '2026-05-10', '2026-06-11', 'active'),
	('5865eff6-4ae8-45ad-9cbb-d26feab6e498', '517f7276-cafb-4fa3-bcd6-aaccaa549109', 21000.00, '2026-04-04', '2026-06-11', 'active'),
	('8fa92c69-51eb-4984-842f-27d3ff859415', 'e6bd2ec3-1ce1-46ae-950e-151f964fbfc2', 24000.00, '2026-05-01', '2026-06-11', 'active'),
	('73d9468d-05cd-448f-bd1c-192eff1a4a8c', '34eb3382-0b20-4875-a0eb-c444f5697992', 195000.00, '2025-12-01', '2026-06-11', 'active'),
	('71e899a2-f5dd-4740-a46e-5e6be4d62d7a', 'a63bd162-f3b2-41c1-bf18-31556a4cd6a4', 19000.00, '2026-05-20', '2026-06-11', 'active'),
	('086d9c1f-d8a3-4287-b665-869602d9d3d0', '2898d6a0-f4b1-4f87-9920-86bc57ef48fe', 27000.00, '2026-05-01', '2026-06-11', 'active'),
	('1581b33d-9b8b-4845-916c-677596cee12a', '871157ac-3725-4477-949c-84aca0641213', 10000.00, '2026-05-25', '2026-06-11', 'active'),
	('dfe83560-76c4-4491-9edc-b2d175d06c04', 'ee04ef4b-f3db-4ed1-a6a0-e43dc84971e4', 62000.00, '2026-03-30', '2026-06-11', 'active'),
	('90185e4f-3a99-446f-92e4-02c12046964c', 'e7c52997-2583-46d9-94e4-069215e5be8c', 68000.00, '2026-05-12', '2026-06-11', 'active'),
	('9d5f0b86-7968-4f08-8933-0c113d90b044', '8da880fa-7e8b-4dc6-8b3f-c5b21969bf49', 19500.00, '2026-06-10', '2026-06-11', 'active'),
	('8f3ceb6a-d0f2-4ffb-9209-76ef9cfa96e1', 'f6ca98cf-e34f-4fdc-9b90-f5881e04eef5', 16000.00, '2026-06-11', '2026-06-11', 'active'),
	('26863aea-462f-4494-affd-aa363ff3a7c4', '1791903d-269b-447e-8f95-a3f1275e190c', 24000.00, '2026-06-08', '2026-06-11', 'active'),
	('4d7dbd0a-9249-4566-ab18-d1e5199d7549', '14f8e6b4-5b7e-4e33-8bb8-cf872b823e67', 11500.00, '2026-04-08', '2026-06-11', 'active'),
	('7b2edc7e-efd9-4efe-a265-3e46932144c7', '52bffe09-ed2f-409f-8cf7-b279cba1874c', 18500.00, '2026-06-09', '2026-06-11', 'active'),
	('7ff4bb39-8460-48b9-a991-d0c28eda28ee', 'f1994221-0020-4df2-97ed-99ec21a5fd8a', 28000.00, '2026-06-10', '2026-06-11', 'active'),
	('1ad0e671-9362-4a59-ab98-0d171c1c1c12', 'c2a35ce2-272b-4740-8eb8-aa7d9261d718', 85000.00, '2026-04-06', '2026-06-11', 'active'),
	('8cd33429-3fb9-4409-b163-8c434d964439', '3181dc59-230e-436a-824d-b0b5abd6a82f', 36000.00, '2026-05-01', '2026-06-11', 'active'),
	('5861ae80-f550-430c-96e7-a2ddf1de7fdf', '5276905c-ddba-486d-b117-6db0b325a164', 42000.00, '2026-05-05', '2026-06-11', 'active'),
	('b3f44cd1-c467-4519-983b-627b41637b62', '181c4a3d-f789-426a-b6a1-bdae947d491a', 45000.00, '2026-04-28', '2026-06-11', 'active'),
	('ef1b5ca5-791f-4d41-9a5b-48185d93194a', 'e65c46bc-3109-4667-8e7d-8e5c7a033944', 32000.00, '2026-03-20', '2026-06-11', 'active'),
	('4b5e2bdd-e660-44eb-adb5-6affbc689783', 'c450c682-401b-4c45-acb3-5c76c9239590', 6000.00, '2026-03-25', '2026-06-11', 'active'),
	('245ac2bc-d542-4f3a-a00f-0abb14ac247b', '990d05b9-ff73-4460-ae5a-5861ceed1730', 33000.00, '2026-05-15', '2026-06-11', 'active'),
	('fa82274d-5f00-4947-a087-151a86577d09', '8360c45c-b7ca-4ccb-83aa-36f398e24aef', 19000.00, '2026-05-02', '2026-06-11', 'active'),
	('56e07af3-3e28-480f-ac6c-57c4e4f058f3', 'b853b385-e376-4914-aa50-d67a38ba065d', 30000.00, '2026-04-20', '2026-06-11', 'active'),
	('b956c178-105e-4c8e-bd52-81889f949ad7', '284d62d6-d808-46a7-a1b0-2565069a364d', 15000.00, '2026-05-20', '2026-06-11', 'active'),
	('13d5e403-03e8-4d9c-a41e-b9756e737d68', NULL, 40000.00, '2026-04-04', '2026-06-11', 'active'),
	('a6a0cc32-3592-4620-88ff-ce09cb351a6e', 'e29794ba-1472-4456-abad-29dbd87002c8', 34000.00, '2026-05-18', '2026-06-11', 'active'),
	('815a972e-d9cd-4361-a40a-f45a80bd4f45', '4a70bac0-b3a8-41a8-966f-19f914da3566', 48000.00, '2026-05-22', '2026-06-11', 'active'),
	('18be55f0-d384-4639-808b-74edd52ce4ec', 'c16f371a-de87-4d71-b537-b5a9972bc22c', 46000.00, '2026-04-20', '2026-06-11', 'active'),
	('21ed0ff4-8c18-4e25-894e-0603dda8ecdf', '781062db-cc9f-44c2-a96f-74ed596ae255', 52000.00, '2026-05-01', '2026-06-11', 'active'),
	('020a1156-eaa8-4b23-9890-aff43c3d36af', '198696ec-ce91-4434-beca-6509769b7ee8', 35000.00, '2026-05-05', '2026-06-11', 'active'),
	('15de2f93-fc21-4abc-bbed-0e8037148057', 'ba128019-2029-4d37-b522-76f766d47f83', 92000.00, '2026-03-10', '2026-06-11', 'active'),
	('bbedac74-9efa-476b-a43e-755a715243b2', '6dbd5e73-a454-4caf-aa04-23b79efc591c', 23000.00, '2026-05-10', '2026-06-11', 'active'),
	('163578b1-4570-4bb8-be59-a5643f9915f0', 'ada6fa92-09cf-43e0-bc0c-83dc12369cf9', 28000.00, '2026-06-05', '2026-06-11', 'active'),
	('198bf34b-870e-4ce0-af4c-d7c003ad4d99', '1a39cfd7-6f63-4a52-aef2-1081ef5406fb', 40000.00, '2026-05-20', '2026-06-11', 'active'),
	('130b7020-dd5e-4d3e-8dbb-d1e39218f1dd', '4f7e0e65-0f85-43ec-ba67-260bbc78578c', 16500.00, '2026-05-25', '2026-06-11', 'active'),
	('cdbb0ed7-1d13-498f-9381-3dfcdd02ebc3', 'e045f503-ce4e-40a6-bbcd-4cb3ae14b469', 340000.00, '2026-06-10', '2026-06-11', 'active'),
	('aad1eff4-fd6b-420e-a0e8-6a6ac31a7c2f', '629ec3cd-4b9f-4595-8fd8-07830ed13c39', 80000.00, '2026-04-08', '2026-06-11', 'active'),
	('c902dd5e-38be-4e2d-8f20-4094a3af546d', '4eb907ac-f757-464f-beca-b4b234db4348', 62000.00, '2026-06-09', '2026-06-11', 'active'),
	('2e3b4760-5f72-4690-b941-5a86ff235e48', '652878f4-e228-468f-b92e-fd6f690acdc8', 175000.00, '2026-06-08', '2026-06-11', 'active'),
	('67fb0d7f-71a1-4c60-81c0-d4530708f103', '2c265d10-f751-4e9b-967b-9eaccb6b055c', 45000.00, '2026-04-07', '2026-06-11', 'active'),
	('36f03eff-f99b-4b9f-9e9c-7839d2fb6bef', '69260bb6-3dbf-4afc-9430-2a1d4c1ffbc0', 36000.00, '2026-05-22', '2026-06-11', 'active'),
	('391db121-f41e-4515-b461-7d4a68b55e2e', 'dfe06490-7ac5-4740-b6fb-82ca5882351b', 11000.00, '2026-05-15', '2026-06-11', 'active'),
	('501d7d68-021d-4aa8-8d8f-84c26f9eab4c', 'c7529e89-8838-491b-a54d-c2f051c42f7e', 55000.00, '2026-06-01', '2026-06-11', 'active'),
	('5177c916-093e-448b-9743-c60c0412ea6d', 'fd82f36d-8682-4791-bf05-1f32e09151b3', 8000.00, '2026-05-10', '2026-06-11', 'active'),
	('60c8a41f-d032-4ffd-bf3d-7cf8e0a3eaaa', 'e4022690-924b-420f-8bd7-62c958513f07', 18000.00, '2026-05-01', '2026-06-11', 'active'),
	('15f2d069-9030-46a8-a7cb-7162ea69c0ef', '17e6518b-02c1-4b05-9592-5bc8ac7b6f9c', 28000.00, '2026-04-15', '2026-06-11', 'active'),
	('51b0b854-a7f0-4c33-9856-2066deeb57c8', '0c124119-ee48-494f-9c33-203cfd1d4088', 195000.00, '2026-03-30', '2026-06-11', 'active'),
	('0399a348-b8c4-457c-8de1-2154fb875bd9', '4dba427c-ae70-4698-a1b3-1711dab8022b', 95000.00, '2026-04-10', '2026-06-11', 'active'),
	('e55a1010-67d4-4260-9d16-27169f2d4f3f', '3c20ea8f-ebcf-47a4-8615-d9338c8915f3', 58000.00, '2026-03-10', '2026-06-11', 'active'),
	('9a5e9c33-0edc-47c6-b2f2-4e366c25cd5f', 'c792b122-959d-49eb-9621-2cb0333a8b53', 165000.00, '2026-04-20', '2026-06-11', 'active'),
	('3c8379e9-031b-4f65-96de-839e4a21dc03', 'b08fcd94-0710-4191-9979-d07be452aeab', 110000.00, '2026-03-10', '2026-06-11', 'active'),
	('e0d9c566-d7a5-45b3-939e-b9ea5375e949', '0ba0ab3d-e88f-49e8-a019-7ec1541dd0f0', 22000.00, '2026-06-11', '2026-06-11', 'active');


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."reviews" ("review_id", "user_id", "product_id", "rating", "comment", "created_at") VALUES
	('469c15ee-9023-4488-817b-eb03fad079b4', '3459b69a-2e3c-47bc-855f-8f244fc2a865', '09db94d4-85b3-4dce-af65-430830ab0abd', 5, 'Trứng gà rất ngon!', '2026-04-09 09:27:07.264864+00'),
	('d9d40744-8847-4843-afe4-5138652e1ce0', '3459b69a-2e3c-47bc-855f-8f244fc2a865', 'aaaa0002-0000-0000-0000-000000000000', 1, 'Test đánh giá', '2026-05-21 03:05:18.205324+00'),
	('d4876570-fcc9-48e2-8516-465356332208', '3459b69a-2e3c-47bc-855f-8f244fc2a865', 'aaaa0008-0000-0000-0000-000000000000', 5, 'meo meo', '2026-05-21 03:05:24.794498+00');


--
-- Data for Name: stores; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."stores" ("store_id", "name", "description", "address", "ward", "district", "city", "phone", "email", "manager_id", "status", "latitude", "longitude", "opening_time", "closing_time", "created_at", "updated_at") VALUES
	('f797ceee-90b6-454d-a464-266739241990', 'GreenPlus UIT', 'Page mô tả về cửa hàng', 'Khu phố 34', 'Phường Linh Xuân', NULL, 'Thành phố Hồ Chí Minh', '0394008204', 'greenplus@email.com', '72c0105f-724a-49f6-a47f-0528118b5361', 'active', NULL, NULL, '08:00:00', '22:00:00', '2026-05-21 13:55:09.427793+00', '2026-05-21 13:55:09.427793+00');


--
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."subscriptions" ("subscription_id", "user_id", "product_id", "schedule", "status", "start_date", "end_date") VALUES
	('4a833955-0a73-46e0-89ad-965f63d47025', 'cd1e5410-5d6f-42e4-b7a7-41e66766aae3', 'aaaa0017-0000-0000-0000-000000000000', 'monthly', 'active', '2026-05-13', NULL),
	('4991862b-4850-4c3c-9b1e-9dc84c835dea', 'cd1e5410-5d6f-42e4-b7a7-41e66766aae3', 'aaaa0001-0000-0000-0000-000000000000', 'weekly', 'active', '2026-05-13', NULL),
	('38543560-e35a-4add-b205-6a53f85b08d0', 'cd1e5410-5d6f-42e4-b7a7-41e66766aae3', 'aaaa0002-0000-0000-0000-000000000000', 'monthly', 'active', '2026-05-15', NULL),
	('84066b72-1e26-4fa2-8b06-00765c2aa49f', '3459b69a-2e3c-47bc-855f-8f244fc2a865', 'aaaa0014-0000-0000-0000-000000000000', 'weekly', 'active', '2026-05-23', NULL),
	('57cfd4ed-f3ab-478e-945e-b59f1a4523b7', '3459b69a-2e3c-47bc-855f-8f244fc2a865', 'aaaa0002-0000-0000-0000-000000000000', 'weekly', 'cancelled', '2026-05-16', NULL),
	('36e75644-ec5f-450a-a42b-94c7d500126a', 'f374c5bf-ed02-4793-bbd8-dae9ca816a36', 'aaaa0002-0000-0000-0000-000000000000', 'weekly', 'cancelled', '2026-06-04', NULL),
	('9b342677-e16d-4964-9c1d-30564ae33f74', 'f374c5bf-ed02-4793-bbd8-dae9ca816a36', 'aaaa0002-0000-0000-0000-000000000000', 'weekly', 'active', '2026-06-11', NULL);


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id", "type", "versioning_status", "lifecycle_configuration", "lifecycle_configuration_generation") VALUES
	('Category-Image', 'Category-Image', NULL, '2026-04-08 13:06:38.528425+00', '2026-04-08 13:06:38.528425+00', true, false, NULL, NULL, NULL, 'STANDARD', 'DISABLED', NULL, NULL),
	('Product-Image', 'Product-Image', NULL, '2026-04-08 13:21:34.703756+00', '2026-04-08 13:21:34.703756+00', true, false, NULL, NULL, NULL, 'STANDARD', 'DISABLED', NULL, NULL),
	('General', 'General', NULL, '2026-04-08 14:15:31.614541+00', '2026-04-08 14:15:31.614541+00', true, false, NULL, NULL, NULL, 'STANDARD', 'DISABLED', NULL, NULL),
	('Post-Attachment', 'Post-Attachment', NULL, '2026-04-08 18:21:20.226697+00', '2026-04-08 18:21:20.226697+00', true, false, NULL, NULL, NULL, 'STANDARD', 'DISABLED', NULL, NULL),
	('User_Images', 'User_Images', NULL, '2026-04-08 18:45:26.521662+00', '2026-04-08 18:45:26.521662+00', true, false, NULL, NULL, NULL, 'STANDARD', 'DISABLED', NULL, NULL);


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."objects" ("id", "bucket_id", "name", "owner", "created_at", "updated_at", "last_accessed_at", "metadata", "version", "owner_id", "user_metadata", "archived_at", "is_delete_marker", "is_versioned") VALUES
	('5c414f9c-b08c-4495-ab48-a55cdde274dd', 'Product-Image', 'products/2026/7798e4c2-5598-41cc-967e-95f3206ce3e9.png', NULL, '2026-06-11 14:06:57.407356+00', '2026-06-11 14:06:57.407356+00', '2026-06-11 14:06:57.407356+00', '{"eTag": "\"fe8f31caf39a6dc9008712cae7575be7\"", "size": 237128, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-11T14:06:58.000Z", "contentLength": 237128, "httpStatusCode": 200}', 'eb1b8a10-404d-4337-bf9d-fc93da261aa1', NULL, '{}', NULL, false, false),
	('4eda42f2-faac-4fff-bd9b-e79e927ca67e', 'Post-Attachment', '3459b69a-2e3c-47bc-855f-8f244fc2a865/6b13b99d-8f5f-44ac-8869-0d015e96291c/1775748044003-31c3ffcefa632.jfif', NULL, '2026-04-09 15:20:43.881122+00', '2026-04-09 15:20:43.881122+00', '2026-04-09 15:20:43.881122+00', '{"eTag": "\"03ce6fe52caa4f2073d266fa370e7466\"", "size": 6733, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-04-09T15:20:44.000Z", "contentLength": 6733, "httpStatusCode": 200}', '933eb474-8449-4753-9325-06ddfa087072', NULL, '{}', NULL, false, false),
	('96bb467e-a357-426c-90f4-7bfc425ad29a', 'Category-Image', 'categories/2026/c098c9a5-1f68-4ce2-810c-d846b1bfcce9.png', NULL, '2026-04-24 12:58:26.866023+00', '2026-04-24 12:58:26.866023+00', '2026-04-24 12:58:26.866023+00', '{"eTag": "\"fa0f6b8b0d285e42c5c0f0a914b75391\"", "size": 389127, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-24T12:58:27.000Z", "contentLength": 389127, "httpStatusCode": 200}', '2133bb05-b805-4ddb-868d-1169179f2120', NULL, '{}', NULL, false, false),
	('83ece481-210a-440d-98a0-c17c28f5820a', 'User_Images', 'users/2026/e936c73e-a9be-438a-8111-7d35735173e9.png', NULL, '2026-04-24 13:04:30.706819+00', '2026-04-24 13:04:30.706819+00', '2026-04-24 13:04:30.706819+00', '{"eTag": "\"e9659dfb27f4663595830044e7a8a0dc\"", "size": 872091, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-24T13:04:31.000Z", "contentLength": 872091, "httpStatusCode": 200}', 'd673e63b-7931-47ed-b1c4-b51fa641b7d3', NULL, '{}', NULL, false, false),
	('f022b460-91e1-4def-9580-a9d16826cb4f', 'User_Images', 'users/2026/99621400-cb76-4f9f-b08a-273498c7b45c.png', NULL, '2026-04-24 13:18:16.724985+00', '2026-04-24 13:18:16.724985+00', '2026-04-24 13:18:16.724985+00', '{"eTag": "\"e9659dfb27f4663595830044e7a8a0dc\"", "size": 872091, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-24T13:18:17.000Z", "contentLength": 872091, "httpStatusCode": 200}', '8bf826f2-a778-4b37-aaf6-bf69433d5701', NULL, '{}', NULL, false, false),
	('314e4388-e610-4526-b1ec-cafcea238244', 'Category-Image', 'noodle.png', NULL, '2026-04-08 13:11:23.686545+00', '2026-04-08 13:11:23.686545+00', '2026-04-08 13:11:23.686545+00', '{"eTag": "\"d6b279dbced90ee8e2990595e53c13ea-1\"", "size": 6352, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-08T13:11:24.000Z", "contentLength": 6352, "httpStatusCode": 200}', 'cc043b15-b3cc-47c3-ad82-4dd372a3458f', NULL, NULL, NULL, false, false),
	('64d8942c-8dc4-41ea-a9b3-070bc6284b34', 'Category-Image', 'fruit.png', NULL, '2026-04-08 13:11:23.768278+00', '2026-04-08 13:11:23.768278+00', '2026-04-08 13:11:23.768278+00', '{"eTag": "\"d6416126820bd2017c876c8e2cf8bf76-1\"", "size": 5725, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-08T13:11:24.000Z", "contentLength": 5725, "httpStatusCode": 200}', '12e8a6c9-3518-4643-b7e6-5817f828e3a7', NULL, NULL, NULL, false, false),
	('e630bb97-1ca5-4bbd-948f-45930c705bb5', 'Category-Image', 'condiment.png', NULL, '2026-04-08 13:11:23.80401+00', '2026-04-08 13:11:23.80401+00', '2026-04-08 13:11:23.80401+00', '{"eTag": "\"c804228b963a79da1e0efaa0d83c74fa-1\"", "size": 5511, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-08T13:11:24.000Z", "contentLength": 5511, "httpStatusCode": 200}', 'dec339f0-0fec-4c5a-a743-4e1dfbe0e6a0', NULL, NULL, NULL, false, false),
	('6b64d589-b53f-41ce-97b6-053f01ed1d8f', 'Category-Image', 'meat.png', NULL, '2026-04-08 13:11:23.830226+00', '2026-04-08 13:11:23.830226+00', '2026-04-08 13:11:23.830226+00', '{"eTag": "\"4fe4011fd4db544b0c30a138e0f20316-1\"", "size": 6525, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-08T13:11:24.000Z", "contentLength": 6525, "httpStatusCode": 200}', '706eb55a-15fd-410f-8b9c-5a257ce7d782', NULL, NULL, NULL, false, false),
	('5d13aa99-46db-4bdf-a044-2cf7ebeb96bf', 'Category-Image', 'milk.png', NULL, '2026-04-08 13:11:23.833234+00', '2026-04-08 13:11:23.833234+00', '2026-04-08 13:11:23.833234+00', '{"eTag": "\"4434671dffe04de23ce6e93d8fc093d7-1\"", "size": 4381, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-08T13:11:24.000Z", "contentLength": 4381, "httpStatusCode": 200}', 'cf21e5b5-c588-40c3-a8fd-f7ee7df03f29', NULL, NULL, NULL, false, false),
	('da79c579-ceb8-49e8-a2f9-de14a756a9ff', 'Category-Image', 'candy.png', NULL, '2026-04-08 13:11:23.847106+00', '2026-04-08 13:11:23.847106+00', '2026-04-08 13:11:23.847106+00', '{"eTag": "\"48a02300055f08af610f1579084f0917-1\"", "size": 6115, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-08T13:11:24.000Z", "contentLength": 6115, "httpStatusCode": 200}', 'b5ff91bd-fc1e-41b0-b729-634472673f1a', NULL, NULL, NULL, false, false),
	('be6eeb09-ddf4-4be7-a10a-8f4f35bf88ad', 'Category-Image', 'drink.png', NULL, '2026-04-08 13:11:23.84889+00', '2026-04-08 13:11:23.84889+00', '2026-04-08 13:11:23.84889+00', '{"eTag": "\"803ff9679213b47347906fad1e8445a2-1\"", "size": 5813, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-08T13:11:24.000Z", "contentLength": 5813, "httpStatusCode": 200}', 'dcb88928-4a71-4b65-8a68-df342a3ed750', NULL, NULL, NULL, false, false),
	('e6cc2d84-0d9e-4715-bf47-4bfe7ffb871a', 'Category-Image', 'jam.png', NULL, '2026-04-08 13:11:23.85924+00', '2026-04-08 13:11:23.85924+00', '2026-04-08 13:11:23.85924+00', '{"eTag": "\"e727d97a334bf3393f215015469b7afe-1\"", "size": 4725, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-08T13:11:24.000Z", "contentLength": 4725, "httpStatusCode": 200}', '0381426c-eb1b-44b5-b08d-3eb672328804', NULL, NULL, NULL, false, false),
	('446db3b5-5791-41ee-a53f-c1e92744da0f', 'Category-Image', 'cereal.png', NULL, '2026-04-08 13:11:23.861044+00', '2026-04-08 13:11:23.861044+00', '2026-04-08 13:11:23.861044+00', '{"eTag": "\"8b14a99c4a93c41257630a4273b95eb9-1\"", "size": 5545, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-08T13:11:24.000Z", "contentLength": 5545, "httpStatusCode": 200}', '48c7231a-91e4-477f-8f5a-864016548bbc', NULL, NULL, NULL, false, false),
	('76358b57-f288-413e-8baa-6653e6a202ad', 'Category-Image', 'alcohol.png', NULL, '2026-04-08 13:11:23.903031+00', '2026-04-08 13:11:23.903031+00', '2026-04-08 13:11:23.903031+00', '{"eTag": "\"a85c5d926fafd405a1d7de50364601da-1\"", "size": 3818, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-08T13:11:24.000Z", "contentLength": 3818, "httpStatusCode": 200}', '7f20f730-589c-4170-a320-3fca1bc623a2', NULL, NULL, NULL, false, false),
	('57b659df-1fe9-4a48-a2a2-c32766a6d333', 'Post-Attachment', 'aa21d783-31ea-4b77-93c6-3bb9c0ec9f57/cb3cb235-732e-4605-9d51-df7a177a2cb7/1779434274480-312d3b6fbb84.mp4', NULL, '2026-05-22 07:17:55.243855+00', '2026-05-22 07:17:55.243855+00', '2026-05-22 07:17:55.243855+00', '{"eTag": "\"b46e2733f57628dc3507b5becb6a6bb9\"", "size": 3425811, "mimetype": "video/mp4", "cacheControl": "max-age=3600", "lastModified": "2026-05-22T07:17:56.000Z", "contentLength": 3425811, "httpStatusCode": 200}', 'b2ed5b4b-590c-4b3c-b382-999faebeafe2', NULL, '{}', NULL, false, false),
	('8708b267-04e7-4c70-b768-e62d68beada6', 'Category-Image', 'sausage.png', NULL, '2026-04-08 13:11:24.434502+00', '2026-04-08 13:11:24.434502+00', '2026-04-08 13:11:24.434502+00', '{"eTag": "\"e91d5edf4ed52ebadf47ae020f9e6c3d-1\"", "size": 7060, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-08T13:11:25.000Z", "contentLength": 7060, "httpStatusCode": 200}', 'f9d2378e-0a69-4d82-92d8-295e8cbe7036', NULL, NULL, NULL, false, false),
	('cc71d85a-da99-4b39-8123-c4551d89a5f4', 'Product-Image', 'trungga.png', NULL, '2026-04-08 13:28:08.490641+00', '2026-04-08 13:28:08.490641+00', '2026-04-08 13:28:08.490641+00', '{"eTag": "\"f4aeec1e84d9c0483919f952f0a2942b-1\"", "size": 170908, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-08T13:28:09.000Z", "contentLength": 170908, "httpStatusCode": 200}', 'fc277106-58ec-455f-9ee3-e17ee0888d61', NULL, NULL, NULL, false, false),
	('5c544ab7-8259-403f-9a83-8464ad34b644', 'Post-Attachment', '3459b69a-2e3c-47bc-855f-8f244fc2a865/28840bac-2aa3-4e66-ab8b-700ff0be4e20/1775748237877-e5121909e43d7.mp4', NULL, '2026-04-09 15:23:58.06788+00', '2026-04-09 15:23:58.06788+00', '2026-04-09 15:23:58.06788+00', '{"eTag": "\"f587bc8ee5af8b4a9a4afb079141f2a2\"", "size": 680143, "mimetype": "video/mp4", "cacheControl": "max-age=3600", "lastModified": "2026-04-09T15:23:59.000Z", "contentLength": 680143, "httpStatusCode": 200}', '34d340f2-74a3-489e-9a3f-41bf6c5ae02d', NULL, '{}', NULL, false, false),
	('bbe2d1c6-61b6-4144-9598-92c37117d2f0', 'Product-Image', 'products/2026/5e875410-d2cd-441b-af39-09f65a1eb0a4.png', NULL, '2026-06-11 14:07:16.000151+00', '2026-06-11 14:07:16.000151+00', '2026-06-11 14:07:16.000151+00', '{"eTag": "\"497b9dfcb36f743a576a33a8c0661998\"", "size": 626054, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-11T14:07:16.000Z", "contentLength": 626054, "httpStatusCode": 200}', '2e4b1404-5728-4bd2-96fd-d85a0911d9e9', NULL, '{}', NULL, false, false),
	('45408846-5c70-4366-9cc3-8109ec4e821e', 'User_Images', 'users/2026/85509751-dcd2-40d1-afd6-e1c402773f71.png', NULL, '2026-04-24 13:22:34.473327+00', '2026-04-24 13:22:34.473327+00', '2026-04-24 13:22:34.473327+00', '{"eTag": "\"e9659dfb27f4663595830044e7a8a0dc\"", "size": 872091, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-24T13:22:35.000Z", "contentLength": 872091, "httpStatusCode": 200}', 'd13834e2-b6ac-4aec-859e-2917b150914e', NULL, '{}', NULL, false, false),
	('82a1decf-477c-496d-89ae-07eaf11c2fbf', 'Post-Attachment', 'aa21d783-31ea-4b77-93c6-3bb9c0ec9f57/0c02eaf8-640f-4ba9-be01-e66d32dfffe8/1779434320984-d42711a706353.png', NULL, '2026-05-22 07:18:41.693007+00', '2026-05-22 07:18:41.693007+00', '2026-05-22 07:18:41.693007+00', '{"eTag": "\"9cd52680e68329f079d61e2c08cb28e9\"", "size": 492374, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-05-22T07:18:42.000Z", "contentLength": 492374, "httpStatusCode": 200}', 'dac85ee2-2df1-495a-b6ac-3709d7f8640b', NULL, '{}', NULL, false, false),
	('74354562-4732-4018-8a46-fe0ef378a5f3', 'Product-Image', 'products/2026/33db75a1-94c8-4e5a-8e92-bb69fda1eb5d.png', NULL, '2026-06-11 14:08:16.439278+00', '2026-06-11 14:08:16.439278+00', '2026-06-11 14:08:16.439278+00', '{"eTag": "\"7b5419d288bd1aa3b6c24a8ec2f2ef94\"", "size": 436590, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-11T14:08:17.000Z", "contentLength": 436590, "httpStatusCode": 200}', 'cc859157-41a0-4cc6-9164-8264745749a0', NULL, '{}', NULL, false, false),
	('368a27d0-391e-49ea-93b9-cb8a86a814ef', 'Post-Attachment', 'aa21d783-31ea-4b77-93c6-3bb9c0ec9f57/0c02eaf8-640f-4ba9-be01-e66d32dfffe8/1779434321811-7a12c3187dbe5.gif', NULL, '2026-05-22 07:18:41.951611+00', '2026-05-22 07:18:41.951611+00', '2026-05-22 07:18:41.951611+00', '{"eTag": "\"767eb11e16e524820123559070d6fd09\"", "size": 350699, "mimetype": "image/gif", "cacheControl": "max-age=3600", "lastModified": "2026-05-22T07:18:42.000Z", "contentLength": 350699, "httpStatusCode": 200}', '028a96d0-a175-4c6f-b5dd-da26813df192', NULL, '{}', NULL, false, false),
	('59f8f338-ca87-4237-8848-d48de13cb0a9', 'Post-Attachment', 'aa21d783-31ea-4b77-93c6-3bb9c0ec9f57/0c02eaf8-640f-4ba9-be01-e66d32dfffe8/1779434322064-037f971d4f15a.png', NULL, '2026-05-22 07:18:42.240059+00', '2026-05-22 07:18:42.240059+00', '2026-05-22 07:18:42.240059+00', '{"eTag": "\"01b9a03ce70ec5dfd3526b72cec0ad3d\"", "size": 26173, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-05-22T07:18:43.000Z", "contentLength": 26173, "httpStatusCode": 200}', '27c38944-4a42-4b9f-a4dc-2baa69c7d58e', NULL, '{}', NULL, false, false),
	('1ce7077c-6dc3-48b3-ac33-293a8a1c265d', 'User_Images', 'users/2026/b5090e9a-9e59-447e-adbf-e3072668a68a.jpg', NULL, '2026-06-11 10:51:22.340574+00', '2026-06-11 10:51:22.340574+00', '2026-06-11 10:51:22.340574+00', '{"eTag": "\"b1bd72f64baa7efb6aab7c94e1d161fc\"", "size": 198733, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-11T10:51:23.000Z", "contentLength": 198733, "httpStatusCode": 200}', '09c6ad0e-7567-4c93-99c2-8570c4b95941', NULL, '{}', NULL, false, false),
	('a4ab7ffa-3552-4c72-93a9-379753c6d02c', 'Product-Image', 'products/2026/ed52c76d-5f95-4328-9562-8c2784f402a2.png', NULL, '2026-06-11 14:09:00.880319+00', '2026-06-11 14:09:00.880319+00', '2026-06-11 14:09:00.880319+00', '{"eTag": "\"1b3e40dd6c4b513792552487e38e7e57\"", "size": 788252, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-11T14:09:01.000Z", "contentLength": 788252, "httpStatusCode": 200}', 'f209983d-7156-4545-baa8-0c85fe5f3c63', NULL, '{}', NULL, false, false),
	('205c7caf-8b07-4b1f-ba39-80274b206244', 'Product-Image', 'products/2026/a7b51844-605e-45b8-a69a-271439aeaa28.png', NULL, '2026-06-11 14:09:46.86139+00', '2026-06-11 14:09:46.86139+00', '2026-06-11 14:09:46.86139+00', '{"eTag": "\"74517c66058f509cae669eb7153a733d\"", "size": 297496, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-11T14:09:47.000Z", "contentLength": 297496, "httpStatusCode": 200}', '96da4437-554c-4ec5-afd9-cbdb2f79f5d2', NULL, '{}', NULL, false, false),
	('bbd17000-b2e1-4b49-ab52-9578051f4e81', 'Category-Image', 'pastry.png', NULL, '2026-04-08 13:11:24.483511+00', '2026-04-08 13:11:24.483511+00', '2026-04-08 13:11:24.483511+00', '{"eTag": "\"c05eea9944ec727cde4b83ad18d051cf-1\"", "size": 5390, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-08T13:11:25.000Z", "contentLength": 5390, "httpStatusCode": 200}', 'd21c8240-9efd-494a-9f4c-204521294575', NULL, NULL, NULL, false, false),
	('a1b10afe-b462-4a4c-b1d0-bc376235ce8c', 'Post-Attachment', '3459b69a-2e3c-47bc-855f-8f244fc2a865/783d2856-2c4c-49ac-80ac-b5102cd34cb7/1775752953258-79560f1d20a07.jpg', NULL, '2026-04-09 16:42:33.56216+00', '2026-04-09 16:42:33.56216+00', '2026-04-09 16:42:33.56216+00', '{"eTag": "\"af54a7a22715d93536af671d3680bfde\"", "size": 172549, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-04-09T16:42:34.000Z", "contentLength": 172549, "httpStatusCode": 200}', '6828035a-26c0-400a-aa2b-af17a9ba673d', NULL, '{}', NULL, false, false),
	('af8d11b4-540a-4ab2-b5dc-7032c10c35da', 'Product-Image', 'products/2026/d91a4a49-7da7-4d88-b1b1-404d10335da5.png', NULL, '2026-06-11 14:07:26.339135+00', '2026-06-11 14:07:26.339135+00', '2026-06-11 14:07:26.339135+00', '{"eTag": "\"497b9dfcb36f743a576a33a8c0661998\"", "size": 626054, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-11T14:07:27.000Z", "contentLength": 626054, "httpStatusCode": 200}', '4d40bbf8-02c7-4d7c-adb4-d5db20b35f87', NULL, '{}', NULL, false, false),
	('3adf98e1-ea71-4abd-9386-d548ec276384', 'Post-Attachment', '3459b69a-2e3c-47bc-855f-8f244fc2a865/783d2856-2c4c-49ac-80ac-b5102cd34cb7/1775752953783-38ee633be327e.jpg', NULL, '2026-04-09 16:42:33.940557+00', '2026-04-09 16:42:33.940557+00', '2026-04-09 16:42:33.940557+00', '{"eTag": "\"fcf53a3bd6ec5b1bb1e40ccd8a333b2f\"", "size": 185337, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-04-09T16:42:34.000Z", "contentLength": 185337, "httpStatusCode": 200}', 'aeb08d9a-68b1-4ecf-92a1-75e307aedd2c', NULL, '{}', NULL, false, false),
	('504e6d5b-b21f-4440-8d2e-82917f1cc73a', 'User_Images', 'users/2026/7a57d7f7-cff0-472e-9fbb-fb5e792151d2.gif', NULL, '2026-05-07 10:03:37.897693+00', '2026-05-07 10:03:37.897693+00', '2026-05-07 10:03:37.897693+00', '{"eTag": "\"767eb11e16e524820123559070d6fd09\"", "size": 350699, "mimetype": "image/gif", "cacheControl": "max-age=3600", "lastModified": "2026-05-07T10:03:38.000Z", "contentLength": 350699, "httpStatusCode": 200}', 'bf72910e-d926-4917-9a89-e65d7af05402', NULL, '{}', NULL, false, false),
	('c36c814d-5ec7-4338-9250-39911786dd45', 'Product-Image', 'products/2026/6068d680-2ab0-45b7-b55e-01ce459f06a1.png', NULL, '2026-06-11 14:07:54.611046+00', '2026-06-11 14:07:54.611046+00', '2026-06-11 14:07:54.611046+00', '{"eTag": "\"73ce069b09454812608a2374d16c1dd1\"", "size": 776951, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-11T14:07:55.000Z", "contentLength": 776951, "httpStatusCode": 200}', 'f5cf7366-9b6c-4fc1-8703-d6bce72635f0', NULL, '{}', NULL, false, false),
	('2d568bb8-b62f-447b-b262-1888de562822', 'Post-Attachment', '72c0105f-724a-49f6-a47f-0528118b5361/1a66e9d7-4e63-4713-a3ea-d268f01dadef/1779454216366-2ad2d48a4215d.mp4', NULL, '2026-05-22 12:50:18.294844+00', '2026-05-22 12:50:18.294844+00', '2026-05-22 12:50:18.294844+00', '{"eTag": "\"b46e2733f57628dc3507b5becb6a6bb9\"", "size": 3425811, "mimetype": "video/mp4", "cacheControl": "max-age=3600", "lastModified": "2026-05-22T12:50:19.000Z", "contentLength": 3425811, "httpStatusCode": 200}', '4f131f14-a318-4635-bfec-b3ea2b2c7c1e', NULL, '{}', NULL, false, false),
	('8d78917c-4416-4e40-b2db-2f0d1188372f', 'Product-Image', 'products/2026/3f5393e3-a964-4ede-aff7-ccec75c3c209.png', NULL, '2026-06-11 14:04:38.143289+00', '2026-06-11 14:04:38.143289+00', '2026-06-11 14:04:38.143289+00', '{"eTag": "\"6b9ef43c4b8786d9292479c39ec0428e\"", "size": 807824, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-11T14:04:39.000Z", "contentLength": 807824, "httpStatusCode": 200}', '734ecbaa-7118-4f0c-9d72-f263701c74d7', NULL, '{}', NULL, false, false),
	('0a304649-b24d-4451-8001-043712aed64c', 'Product-Image', 'products/2026/3df16fb7-7003-473e-907b-a5421eeb8443.png', NULL, '2026-06-11 14:09:20.145577+00', '2026-06-11 14:09:20.145577+00', '2026-06-11 14:09:20.145577+00', '{"eTag": "\"5764e224a68e40ae173ff2062d57e4e0\"", "size": 780850, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-11T14:09:21.000Z", "contentLength": 780850, "httpStatusCode": 200}', '25b07f5e-9289-4000-955f-d6185bd44805', NULL, '{}', NULL, false, false),
	('67794cf2-80a7-4a21-a0dd-d08bc27a066e', 'Product-Image', 'products/2026/b2beb3fc-acec-496c-b9aa-90330154855b.png', NULL, '2026-06-11 14:05:15.691556+00', '2026-06-11 14:05:15.691556+00', '2026-06-11 14:05:15.691556+00', '{"eTag": "\"495df8fd64aaa31e3a136b417e83e394\"", "size": 39971, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-11T14:05:16.000Z", "contentLength": 39971, "httpStatusCode": 200}', 'f3704491-0788-4056-81d5-ae0115545b9e', NULL, '{}', NULL, false, false),
	('2f96d12f-8faf-44ec-89c0-30069ce6cf6d', 'Product-Image', 'products/2026/624a9251-4ae8-43c2-be27-3f23957eda68.png', NULL, '2026-06-11 14:05:44.979682+00', '2026-06-11 14:05:44.979682+00', '2026-06-11 14:05:44.979682+00', '{"eTag": "\"ca64dc8392753741fc785a2fe0a6f36d\"", "size": 302191, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-11T14:05:45.000Z", "contentLength": 302191, "httpStatusCode": 200}', '14845b9f-36d7-4faa-bb77-3bd8fa70dedb', NULL, '{}', NULL, false, false),
	('83670913-def1-4866-95ca-f8e5d24617e4', 'Product-Image', 'products/2026/4a552043-b2a7-4949-bb81-3edd21ef2de7.png', NULL, '2026-06-11 14:06:37.28214+00', '2026-06-11 14:06:37.28214+00', '2026-06-11 14:06:37.28214+00', '{"eTag": "\"20173f6c12eab61c105a0f53cede288d\"", "size": 787117, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-11T14:06:38.000Z", "contentLength": 787117, "httpStatusCode": 200}', 'ec7034a5-92a9-4fcf-aa4d-2c831ee11b89', NULL, '{}', NULL, false, false),
	('93bb00df-3c6b-49fc-9151-c00230c7c3d3', 'Category-Image', 'sauce.png', NULL, '2026-04-08 13:11:24.488251+00', '2026-04-08 13:11:24.488251+00', '2026-04-08 13:11:24.488251+00', '{"eTag": "\"6f6ec7439b9aebf4ffce0c67c7851b45-1\"", "size": 4156, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-08T13:11:25.000Z", "contentLength": 4156, "httpStatusCode": 200}', '3ee249c3-2602-4195-a27f-562adaf07415', NULL, NULL, NULL, false, false),
	('82bdf2c6-a518-43be-87d4-3a67b13df4ce', 'Product-Image', 'products/2026/426b2d2d-5ba3-41aa-a2c0-5db0bf6e0e7a.png', NULL, '2026-06-11 14:11:47.076078+00', '2026-06-11 14:11:47.076078+00', '2026-06-11 14:11:47.076078+00', '{"eTag": "\"134fcbcfa63eb25a6b530121ec377494\"", "size": 404909, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-11T14:11:48.000Z", "contentLength": 404909, "httpStatusCode": 200}', '869b1839-cf76-4c63-a487-3c84030d214a', NULL, '{}', NULL, false, false),
	('064ff119-3e20-4d4f-87f2-4395dfb23f64', 'Post-Attachment', 'b965bce8-faac-41f7-9630-b4a4d6754773/4a6231f9-1c67-4f26-9a02-59c4e32a1ae5/1775815530794-d07be04601932.mp4', NULL, '2026-04-10 10:05:32.160279+00', '2026-04-10 10:05:32.160279+00', '2026-04-10 10:05:32.160279+00', '{"eTag": "\"14cfdcec467484ef96330856e878ef22\"", "size": 3081248, "mimetype": "video/mp4", "cacheControl": "max-age=3600", "lastModified": "2026-04-10T10:05:33.000Z", "contentLength": 3081248, "httpStatusCode": 200}', '4fe21ca6-7ceb-47df-b82c-ddda8794fb90', NULL, '{}', NULL, false, false),
	('40188739-06bc-4d42-bd33-b677085b0ea2', 'Post-Attachment', 'b965bce8-faac-41f7-9630-b4a4d6754773/001ec22a-e813-4aa9-8606-952e1f9de253/1775815554646-63a349bb26f6d.jpg', NULL, '2026-04-10 10:05:55.693875+00', '2026-04-10 10:05:55.693875+00', '2026-04-10 10:05:55.693875+00', '{"eTag": "\"b1bd72f64baa7efb6aab7c94e1d161fc\"", "size": 198733, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-04-10T10:05:56.000Z", "contentLength": 198733, "httpStatusCode": 200}', '19c75efc-a55a-4d4a-bd8a-f44d1304e8c1', NULL, '{}', NULL, false, false),
	('f77f3c86-4b39-4308-abe8-8b0a9efe6519', 'Product-Image', 'products/2026/79952588-9533-4ace-bc16-e37456fa9545.png', NULL, '2026-06-11 14:16:47.432394+00', '2026-06-11 14:16:47.432394+00', '2026-06-11 14:16:47.432394+00', '{"eTag": "\"f84e48d675de8459da0a6ee8a6b89106\"", "size": 382640, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-11T14:16:48.000Z", "contentLength": 382640, "httpStatusCode": 200}', 'ee08fba7-16be-4321-b473-c3e1bf4900c9', NULL, '{}', NULL, false, false),
	('e3c83a89-dc05-47f8-93e9-b8127baa62e8', 'Post-Attachment', '6bd2f08a-3cfb-49b1-b07f-05fe031ce589/78a31f4e-20bc-4219-a815-60acd9c09762/1775815759002-4e689c691a934.png', NULL, '2026-04-10 10:09:20.4254+00', '2026-04-10 10:09:20.4254+00', '2026-04-10 10:09:20.4254+00', '{"eTag": "\"5358a7e426df4f7b8216c07e32251eec\"", "size": 2263059, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-10T10:09:21.000Z", "contentLength": 2263059, "httpStatusCode": 200}', '48246d5f-c6a1-4649-acae-719290ef368f', NULL, '{}', NULL, false, false),
	('c774aacc-7b64-44f8-995a-f6fbdb4004d1', 'Post-Attachment', '6bd2f08a-3cfb-49b1-b07f-05fe031ce589/78a31f4e-20bc-4219-a815-60acd9c09762/1775815759845-167164e2ab861.png', NULL, '2026-04-10 10:09:21.001849+00', '2026-04-10 10:09:21.001849+00', '2026-04-10 10:09:21.001849+00', '{"eTag": "\"40c9d361acaf2f507801b0de584248f5\"", "size": 4137872, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-10T10:09:21.000Z", "contentLength": 4137872, "httpStatusCode": 200}', '8f9a4a8b-973f-42f9-ac39-dd5f15531f23', NULL, '{}', NULL, false, false),
	('61b1e255-4819-4377-aef5-abc3f8c340d2', 'Product-Image', 'products/2026/dd8b33e1-b6b9-4768-bfcb-3ed00b9d7c1b.png', NULL, '2026-06-11 14:17:35.358942+00', '2026-06-11 14:17:35.358942+00', '2026-06-11 14:17:35.358942+00', '{"eTag": "\"74317a6b718b2dd592cfb2133fbf46ed\"", "size": 776501, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-11T14:17:36.000Z", "contentLength": 776501, "httpStatusCode": 200}', '37d8b44e-e100-4abf-b0ec-ccf55419f49c', NULL, '{}', NULL, false, false),
	('1f150edf-6a1b-449a-9607-79735bf389b7', 'Post-Attachment', '6bd2f08a-3cfb-49b1-b07f-05fe031ce589/78a31f4e-20bc-4219-a815-60acd9c09762/1775815760406-5bf2d207d60d.png', NULL, '2026-04-10 10:09:21.472333+00', '2026-04-10 10:09:21.472333+00', '2026-04-10 10:09:21.472333+00', '{"eTag": "\"19f1523e2a303f1e13cc278d6884461d\"", "size": 1140454, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-10T10:09:22.000Z", "contentLength": 1140454, "httpStatusCode": 200}', '8ddf2d2b-a8c7-4ea3-8d12-4cb109543d62', NULL, '{}', NULL, false, false),
	('5c0dfd9e-3f47-4263-a1e9-39de3ddb2034', 'Post-Attachment', '6bd2f08a-3cfb-49b1-b07f-05fe031ce589/3ce27d0d-5ed7-4193-9021-e030f2348d21/1775815815469-333508c0b2267.mp4', NULL, '2026-04-10 10:10:17.601933+00', '2026-04-10 10:10:17.601933+00', '2026-04-10 10:10:17.601933+00', '{"eTag": "\"e04b7fbd9dd4c8698196c944e0d78d69-2\"", "size": 5753256, "mimetype": "video/mp4", "cacheControl": "max-age=3600", "lastModified": "2026-04-10T10:10:18.000Z", "contentLength": 5753256, "httpStatusCode": 200}', 'c5048e76-492b-4ccd-af5f-3b9746bcb404', NULL, '{}', NULL, false, false),
	('3ebae272-2227-410a-aa2f-d101e428db67', 'Product-Image', 'products/2026/340a2613-f56c-40bc-9e78-3224f765b50f.png', NULL, '2026-06-11 14:18:11.079651+00', '2026-06-11 14:18:11.079651+00', '2026-06-11 14:18:11.079651+00', '{"eTag": "\"f9b90978a21cb2f6bcbee30fdca49b6e\"", "size": 617730, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-11T14:18:12.000Z", "contentLength": 617730, "httpStatusCode": 200}', '0d3df54e-551b-4421-82b4-124e60365075', NULL, '{}', NULL, false, false),
	('2bfe9f61-f4e1-4564-8276-8df6411e6416', 'User_Images', 'users/2026/858a4ed6-8187-442b-9287-16fe7f2478ac.png', NULL, '2026-05-07 10:03:52.417536+00', '2026-05-07 10:03:52.417536+00', '2026-05-07 10:03:52.417536+00', '{"eTag": "\"01b9a03ce70ec5dfd3526b72cec0ad3d\"", "size": 26173, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-05-07T10:03:53.000Z", "contentLength": 26173, "httpStatusCode": 200}', 'bb845f29-3359-4d46-8a9a-3127c46f6752', NULL, '{}', NULL, false, false),
	('432ce3ab-e464-4880-a519-065a56d0f7d0', 'Category-Image', 'oil.png', NULL, '2026-04-08 13:11:24.516773+00', '2026-04-08 13:11:24.516773+00', '2026-04-08 13:11:24.516773+00', '{"eTag": "\"58c9e6eca3ac5d2326854aa99d22e635-1\"", "size": 3489, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-08T13:11:25.000Z", "contentLength": 3489, "httpStatusCode": 200}', 'c62ea5e3-e2a5-40b7-843d-8fc78d062f35', NULL, NULL, NULL, false, false),
	('1e80b091-4459-4fff-aab0-1be8513250f2', 'Category-Image', 'utility.png', NULL, '2026-04-08 13:11:24.537736+00', '2026-04-08 13:11:24.537736+00', '2026-04-08 13:11:24.537736+00', '{"eTag": "\"f27f4e3712d9b08a5ee6c70889c4e4be-1\"", "size": 4613, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-08T13:11:25.000Z", "contentLength": 4613, "httpStatusCode": 200}', 'c32fa208-2ba4-419c-a3c5-5fcf2946c573', NULL, NULL, NULL, false, false),
	('951e8845-5050-48c0-936b-1fb910d830cb', 'Product-Image', 'products/2026/14c03d0a-d8bd-4e47-8bff-d6acd50f3c23.png', NULL, '2026-06-11 14:16:22.647538+00', '2026-06-11 14:16:22.647538+00', '2026-06-11 14:16:22.647538+00', '{"eTag": "\"1a3404520dd84bc8914843f6de12b0b5\"", "size": 244097, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-11T14:16:23.000Z", "contentLength": 244097, "httpStatusCode": 200}', '85a9bfe1-293d-4019-93a6-4d82eea7b43e', NULL, '{}', NULL, false, false),
	('945084e5-067f-4268-a7ab-dae71b00bd7a', 'Post-Attachment', '3459b69a-2e3c-47bc-855f-8f244fc2a865/f176e89b-cd2b-40cd-a78d-20a1fe254616/1776429858543-876221e79b2d.png', NULL, '2026-04-17 12:44:19.150374+00', '2026-04-17 12:44:19.150374+00', '2026-04-17 12:44:19.150374+00', '{"eTag": "\"5358a7e426df4f7b8216c07e32251eec\"", "size": 2263059, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-17T12:44:20.000Z", "contentLength": 2263059, "httpStatusCode": 200}', '1f9ec26c-5d59-43c1-967e-2498886b1370', NULL, '{}', NULL, false, false),
	('538145c2-0c4a-4450-9697-bdd316db578c', 'User_Images', 'cd1e5410-5d6f-42e4-b7a7-41e66766aae3/1778668197216-344dd54cf7c79.gif', NULL, '2026-05-13 10:29:58.051846+00', '2026-05-13 10:29:58.051846+00', '2026-05-13 10:29:58.051846+00', '{"eTag": "\"42cea054b3bf1a4bb2dd51b1ba93ec55\"", "size": 1244667, "mimetype": "image/gif", "cacheControl": "max-age=3600", "lastModified": "2026-05-13T10:29:58.000Z", "contentLength": 1244667, "httpStatusCode": 200}', 'bfdebfa9-5a73-42ef-ac7b-b4bf0eb0e062', NULL, '{}', NULL, false, false),
	('5fa5284d-08c6-460d-8151-1c0b69300b23', 'User_Images', 'users/2026/5b3d0230-6830-4ad8-9a22-7232ae58729d.jpg', NULL, '2026-05-24 14:31:29.626419+00', '2026-05-24 14:31:29.626419+00', '2026-05-24 14:31:29.626419+00', '{"eTag": "\"03ce6fe52caa4f2073d266fa370e7466\"", "size": 6733, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-05-24T14:31:30.000Z", "contentLength": 6733, "httpStatusCode": 200}', '7f4254ca-fcc0-4557-bc86-46a8e997e78c', NULL, '{}', NULL, false, false),
	('b304540d-b974-420d-904b-bf7aa8149a47', 'Product-Image', 'products/2026/fb42e7bc-f28f-4eec-ae06-3c2e2a937189.png', NULL, '2026-06-11 14:04:53.474537+00', '2026-06-11 14:04:53.474537+00', '2026-06-11 14:04:53.474537+00', '{"eTag": "\"317d44ad9774c6fb635ebcebb2e10024\"", "size": 57076, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-11T14:04:54.000Z", "contentLength": 57076, "httpStatusCode": 200}', '010742a8-ab56-4423-b9e8-1e53ef458d10', NULL, '{}', NULL, false, false),
	('f2f9bd64-41e1-4a24-8a87-d422747f4240', 'Product-Image', 'products/2026/a33bb226-1f6b-4cfc-8d1d-ef538c278579.png', NULL, '2026-06-11 14:17:12.091648+00', '2026-06-11 14:17:12.091648+00', '2026-06-11 14:17:12.091648+00', '{"eTag": "\"99c1032686cd995ced78e3e78a9c07b7\"", "size": 198784, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-11T14:17:13.000Z", "contentLength": 198784, "httpStatusCode": 200}', '74f9422d-df3d-491a-8b9c-f28cedc2869a', NULL, '{}', NULL, false, false),
	('1d3e7da1-30e2-42b6-94f9-e4debb6251ec', 'Product-Image', 'products/2026/06fa4194-7bff-4bcb-a0b2-d02f7592a236.png', NULL, '2026-06-11 14:05:31.605034+00', '2026-06-11 14:05:31.605034+00', '2026-06-11 14:05:31.605034+00', '{"eTag": "\"fe8f31caf39a6dc9008712cae7575be7\"", "size": 237128, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-11T14:05:32.000Z", "contentLength": 237128, "httpStatusCode": 200}', '69a7b15c-a583-435e-ba59-bb04134d7e27', NULL, '{}', NULL, false, false),
	('2f7e07d8-468d-4b84-b9c4-c944ec6dd203', 'Product-Image', 'products/2026/16280f80-6f27-49f2-950f-8ba7c3412cb1.png', NULL, '2026-06-11 14:06:07.977956+00', '2026-06-11 14:06:07.977956+00', '2026-06-11 14:06:07.977956+00', '{"eTag": "\"d8ffe38bdd642c41386bca850b800ffc\"", "size": 133045, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-11T14:06:08.000Z", "contentLength": 133045, "httpStatusCode": 200}', '0dfd5f9e-e81c-4659-b849-8ce5d9cf89cd', NULL, '{}', NULL, false, false),
	('d113e2ff-b670-497e-9b5b-614a92ee4ee4', 'Product-Image', 'products/2026/5db2492d-bfe4-4578-980f-0cc59406beab.png', NULL, '2026-06-11 14:17:52.967685+00', '2026-06-11 14:17:52.967685+00', '2026-06-11 14:17:52.967685+00', '{"eTag": "\"5be27aaa1d99bb13bf124d56a4261cf6\"", "size": 616727, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-11T14:17:53.000Z", "contentLength": 616727, "httpStatusCode": 200}', '324f3723-591f-4b1f-ae90-5d5537df9812', NULL, '{}', NULL, false, false),
	('773728a0-1d3a-4528-b838-04013f7b51e4', 'Product-Image', 'products/2026/ad103e96-f802-4792-b811-f425046c8f22.png', NULL, '2026-06-11 14:06:44.986427+00', '2026-06-11 14:06:44.986427+00', '2026-06-11 14:06:44.986427+00', '{"eTag": "\"20173f6c12eab61c105a0f53cede288d\"", "size": 787117, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-11T14:06:45.000Z", "contentLength": 787117, "httpStatusCode": 200}', 'b776b31d-a1de-4544-88bf-7c3736bba963', NULL, '{}', NULL, false, false),
	('6a481ead-d00b-4106-af9a-5a5fde7dcc87', 'Product-Image', 'products/2026/9cd587a5-9cf9-4849-b580-f9b66e3edf7a.png', NULL, '2026-06-11 14:20:14.41984+00', '2026-06-11 14:20:14.41984+00', '2026-06-11 14:20:14.41984+00', '{"eTag": "\"1a689d76e07e6309431445179c34cb4c\"", "size": 331593, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-11T14:20:15.000Z", "contentLength": 331593, "httpStatusCode": 200}', '20b63cc7-14e7-4670-80f1-eab478becec5', NULL, '{}', NULL, false, false),
	('f9859181-4e83-4ed1-bc5f-4dde07389f13', 'Category-Image', 'sweet.png', NULL, '2026-04-08 13:11:24.526246+00', '2026-04-08 13:11:24.526246+00', '2026-04-08 13:11:24.526246+00', '{"eTag": "\"ddd5119ba5a9029310917c03d63b59aa-1\"", "size": 5867, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-08T13:11:25.000Z", "contentLength": 5867, "httpStatusCode": 200}', 'e2fd0a92-e23e-47f0-a13a-f68dfc9ec9f3', NULL, NULL, NULL, false, false),
	('71247fa0-6096-4956-b82a-289bd387264a', 'Product-Image', 'products/2026/40379853-8ab4-42e9-bac3-29fbba4f69da.png', NULL, '2026-06-11 14:20:09.21979+00', '2026-06-11 14:20:09.21979+00', '2026-06-11 14:20:09.21979+00', '{"eTag": "\"1a689d76e07e6309431445179c34cb4c\"", "size": 331593, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-11T14:20:10.000Z", "contentLength": 331593, "httpStatusCode": 200}', '33cb4529-a647-45b2-b82f-c3b709f4a838', NULL, '{}', NULL, false, false),
	('137faee6-dd42-483f-a417-e504a0bf398b', 'User_Images', '3459b69a-2e3c-47bc-855f-8f244fc2a865/1776874976199-5f8597da08fb2.png', NULL, '2026-04-22 16:22:56.023034+00', '2026-04-22 16:22:56.023034+00', '2026-04-22 16:22:56.023034+00', '{"eTag": "\"e85f4c57a9ca05136f8e374bd4779a5e\"", "size": 135494, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-22T16:22:57.000Z", "contentLength": 135494, "httpStatusCode": 200}', '6f3cea5d-db30-4889-a792-b112298610c1', NULL, '{}', NULL, false, false),
	('0c80590c-6d29-44bd-911f-6cc53b689ff4', 'User_Images', 'cd1e5410-5d6f-42e4-b7a7-41e66766aae3/1778850012750-ae29f4f63f68.jfif', NULL, '2026-05-15 13:00:13.080103+00', '2026-05-15 13:00:13.080103+00', '2026-05-15 13:00:13.080103+00', '{"eTag": "\"03ce6fe52caa4f2073d266fa370e7466\"", "size": 6733, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-05-15T13:00:13.000Z", "contentLength": 6733, "httpStatusCode": 200}', 'e77a669f-6f74-4f66-a9f8-6755c14985e8', NULL, '{}', NULL, false, false),
	('44d1581c-a25c-4b09-80b2-803a61306675', 'Product-Image', 'products/2026/1296f22e-b989-44bd-8c1d-73ce57487705.png', NULL, '2026-06-11 14:20:29.328835+00', '2026-06-11 14:20:29.328835+00', '2026-06-11 14:20:29.328835+00', '{"eTag": "\"8f5bffb526a5d7655447553e19d40f01\"", "size": 431282, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-11T14:20:30.000Z", "contentLength": 431282, "httpStatusCode": 200}', 'df32dfc9-d07c-4dc8-a1f3-c9102d233309', NULL, '{}', NULL, false, false),
	('e6c5bcc1-074a-40d6-b349-3565e5d52d23', 'User_Images', 'users/2026/6f80b374-d7ee-4014-ad4f-17adb7401a5a.png', NULL, '2026-05-24 14:31:45.450486+00', '2026-05-24 14:31:45.450486+00', '2026-05-24 14:31:45.450486+00', '{"eTag": "\"3958ee899317a21a151e3dfd15e20451\"", "size": 186497, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-05-24T14:31:46.000Z", "contentLength": 186497, "httpStatusCode": 200}', '61b8988c-b252-4389-8a8e-5b98f2f8468e', NULL, '{}', NULL, false, false),
	('f5257a23-12b3-4e25-9e26-14619dca7fd2', 'User_Images', 'users/2026/84389787-b888-4518-8556-89c94b473f99.jpg', NULL, '2026-05-24 14:32:58.585274+00', '2026-05-24 14:32:58.585274+00', '2026-05-24 14:32:58.585274+00', '{"eTag": "\"f85a0e294f72c4068651e2cadc53be27\"", "size": 117987, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-05-24T14:32:59.000Z", "contentLength": 117987, "httpStatusCode": 200}', 'b083f653-4f7c-42fe-8195-a3af71ed1595', NULL, '{}', NULL, false, false),
	('1c3da504-7c8a-4aa6-b96b-404b449a89db', 'Product-Image', 'products/2026/6cd25148-6243-4aaa-92b7-8201ecadc4dd.png', NULL, '2026-06-11 14:20:58.934019+00', '2026-06-11 14:20:58.934019+00', '2026-06-11 14:20:58.934019+00', '{"eTag": "\"7d6d4bad9e990460e1a02355073b8bec\"", "size": 168992, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-11T14:20:59.000Z", "contentLength": 168992, "httpStatusCode": 200}', '22563c06-c8fe-4871-a55f-20298d66da5c', NULL, '{}', NULL, false, false),
	('103627aa-fc5f-4062-a86d-6906f644b40d', 'Product-Image', 'products/2026/b97178ae-bb4d-4b0e-ad31-fa96d918634e.png', NULL, '2026-06-11 14:21:39.984387+00', '2026-06-11 14:21:39.984387+00', '2026-06-11 14:21:39.984387+00', '{"eTag": "\"f3063afbf66a03a76862072d2a4407be\"", "size": 219728, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-11T14:21:40.000Z", "contentLength": 219728, "httpStatusCode": 200}', '899b8dd9-3841-4720-9517-77a856c08312', NULL, '{}', NULL, false, false),
	('a966768e-f365-4880-8d68-be670320f9a5', 'Product-Image', 'products/2026/80b350d5-7ea4-4fa3-843d-ba1b15d668a8.png', NULL, '2026-06-11 14:21:59.46202+00', '2026-06-11 14:21:59.46202+00', '2026-06-11 14:21:59.46202+00', '{"eTag": "\"f60db39e6ad0431ef91c3342a61c2f15\"", "size": 84630, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-11T14:22:00.000Z", "contentLength": 84630, "httpStatusCode": 200}', '3355ce13-3607-4210-9e99-104c2c186ea9', NULL, '{}', NULL, false, false),
	('6fe10468-6d05-42ed-80e0-aa186ebae647', 'Product-Image', 'products/2026/dd7773e6-fc71-4ac6-8e29-6b1f93a1ca29.png', NULL, '2026-06-11 14:26:54.448488+00', '2026-06-11 14:26:54.448488+00', '2026-06-11 14:26:54.448488+00', '{"eTag": "\"f01a722d0af77d95bf40012eed240b27\"", "size": 56989, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-11T14:26:55.000Z", "contentLength": 56989, "httpStatusCode": 200}', 'acf541be-e23c-4a6a-8d7c-4b82a9436064', NULL, '{}', NULL, false, false),
	('a9cfdcc5-bc75-4fd7-be14-b70808f4a349', 'Product-Image', 'products/2026/b32c0551-e3de-4c43-af8f-bafd3d912ebe.png', NULL, '2026-06-11 14:27:29.320595+00', '2026-06-11 14:27:29.320595+00', '2026-06-11 14:27:29.320595+00', '{"eTag": "\"b619b0c8c2f156025aa613753ba49ba1\"", "size": 1031104, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-11T14:27:30.000Z", "contentLength": 1031104, "httpStatusCode": 200}', 'a51b7b5e-a67d-48e6-878a-86baf763c3c1', NULL, '{}', NULL, false, false),
	('53196bc5-d519-46b0-84cc-811e09b07832', 'Category-Image', 'tea.png', NULL, '2026-04-08 13:11:24.526294+00', '2026-04-08 13:11:24.526294+00', '2026-04-08 13:11:24.526294+00', '{"eTag": "\"71a147ec1adf99bae468cbe0e871c1cf-1\"", "size": 6347, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-08T13:11:25.000Z", "contentLength": 6347, "httpStatusCode": 200}', '0fb852df-69be-42d1-bbb2-049373d27838', NULL, NULL, NULL, false, false),
	('5595fc71-ea97-4cf6-aaa5-f3b50bfd0b4e', 'Product-Image', 'products/2026/21f454a7-65e5-47fd-a22e-f41f20dc4f2c.png', NULL, '2026-06-11 14:20:43.897578+00', '2026-06-11 14:20:43.897578+00', '2026-06-11 14:20:43.897578+00', '{"eTag": "\"e34bcf04cc891985b49bdf3703397ffb\"", "size": 302056, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-11T14:20:44.000Z", "contentLength": 302056, "httpStatusCode": 200}', '79c1b909-9ef6-45c5-b9cb-a302ee329fd7', NULL, '{}', NULL, false, false),
	('c2cf3fd8-fdd9-4c76-ad38-ce3341c7a884', 'User_Images', 'users/2026/8b3f21c1-f743-4db7-88ae-bbdd8c7a2cdc.jpg', NULL, '2026-04-24 08:55:07.742301+00', '2026-04-24 08:55:07.742301+00', '2026-04-24 08:55:07.742301+00', '{"eTag": "\"03ce6fe52caa4f2073d266fa370e7466\"", "size": 6733, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-04-24T08:55:08.000Z", "contentLength": 6733, "httpStatusCode": 200}', '0b053759-3890-4139-9a38-1880d1f2ee61', NULL, '{}', NULL, false, false),
	('4e625373-488e-4bfb-964d-400fe7d941bd', 'User_Images', 'users/2026/50931aed-bb32-4f59-9010-118af24e3303.png', NULL, '2026-04-24 08:56:39.210649+00', '2026-04-24 08:56:39.210649+00', '2026-04-24 08:56:39.210649+00', '{"eTag": "\"a06a7cc734f722d3337b6a6d7cecb8af\"", "size": 159533, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-24T08:56:40.000Z", "contentLength": 159533, "httpStatusCode": 200}', 'a3ab9f19-ca09-475d-a4f9-7c6b2897e99f', NULL, '{}', NULL, false, false),
	('de541b2b-ef1d-4f48-8a03-6eded8357422', 'Product-Image', 'products/2026/e5c86641-5c92-4ad5-9d1f-e09c2d92c00b.png', NULL, '2026-06-11 14:21:16.111034+00', '2026-06-11 14:21:16.111034+00', '2026-06-11 14:21:16.111034+00', '{"eTag": "\"6802e6ba190a37f09599b11020422fe8\"", "size": 726134, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-11T14:21:17.000Z", "contentLength": 726134, "httpStatusCode": 200}', '81c1210f-f198-4c51-8cec-2debd22e98bd', NULL, '{}', NULL, false, false),
	('c16d1543-10a6-4d20-a379-292df0742824', 'User_Images', 'users/2026/7d34ad0b-11b5-4f17-9a0c-8abc6f97381d.png', NULL, '2026-05-20 18:11:31.383042+00', '2026-05-20 18:11:31.383042+00', '2026-05-20 18:11:31.383042+00', '{"eTag": "\"a06a7cc734f722d3337b6a6d7cecb8af\"", "size": 159533, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-05-20T18:11:32.000Z", "contentLength": 159533, "httpStatusCode": 200}', 'e4c65e5e-3a68-43b5-950b-b162fc69b7a4', NULL, '{}', NULL, false, false),
	('84345a5d-1460-42dd-b485-872d50468ca6', 'Post-Attachment', '72c0105f-724a-49f6-a47f-0528118b5361/76031dc7-efbd-420d-8033-41e17915c17d/1779634409525-54409c8998b15.png', NULL, '2026-05-24 14:53:31.31839+00', '2026-05-24 14:53:31.31839+00', '2026-05-24 14:53:31.31839+00', '{"eTag": "\"40c9d361acaf2f507801b0de584248f5\"", "size": 4137872, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-05-24T14:53:32.000Z", "contentLength": 4137872, "httpStatusCode": 200}', 'dcc4f5a9-bf45-4d39-b030-dd10f68a2601', NULL, '{}', NULL, false, false),
	('a59a4e66-9373-42af-a3a7-696699b21951', 'Product-Image', 'products/2026/69270ec5-d501-4ce1-9881-9c5d59ae7ac5.png', NULL, '2026-06-11 14:27:11.249841+00', '2026-06-11 14:27:11.249841+00', '2026-06-11 14:27:11.249841+00', '{"eTag": "\"eb7f7387a4d93f5b2b556878ac26b26c\"", "size": 1128953, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-11T14:27:12.000Z", "contentLength": 1128953, "httpStatusCode": 200}', '6c4f9ff5-1078-4e3e-aae2-113c1f5ff04b', NULL, '{}', NULL, false, false),
	('f8d7a71d-74e8-466a-9bca-6b936e87a00e', 'Post-Attachment', '72c0105f-724a-49f6-a47f-0528118b5361/76031dc7-efbd-420d-8033-41e17915c17d/1779634410602-83b94d7ed6275.png', NULL, '2026-05-24 14:53:31.653093+00', '2026-05-24 14:53:31.653093+00', '2026-05-24 14:53:31.653093+00', '{"eTag": "\"19f1523e2a303f1e13cc278d6884461d\"", "size": 1140454, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-05-24T14:53:32.000Z", "contentLength": 1140454, "httpStatusCode": 200}', '061ef407-7e6b-422f-9747-b09e626c8e97', NULL, '{}', NULL, false, false),
	('24b08488-6fbb-4178-856f-7d57718cab32', 'Product-Image', 'products/2026/f6600eb7-f2a7-486e-82c1-3e6341c866a3.png', NULL, '2026-06-11 14:27:49.770538+00', '2026-06-11 14:27:49.770538+00', '2026-06-11 14:27:49.770538+00', '{"eTag": "\"358ccd21986be2276ee81883da73fe6d\"", "size": 1343790, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-11T14:27:50.000Z", "contentLength": 1343790, "httpStatusCode": 200}', 'ac015092-16c9-441d-ae9d-6df54fcffe09', NULL, '{}', NULL, false, false),
	('703a71bd-35cb-4b37-b741-c473d8327ba1', 'Product-Image', 'products/2026/ff635b68-7601-42a0-aa35-ef4d83188ab9.png', NULL, '2026-06-11 14:28:36.713734+00', '2026-06-11 14:28:36.713734+00', '2026-06-11 14:28:36.713734+00', '{"eTag": "\"3413d6e0c6d5ad518e9495ac60de387f\"", "size": 978752, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-11T14:28:37.000Z", "contentLength": 978752, "httpStatusCode": 200}', '4488d615-e004-47fd-a05a-57279a71973e', NULL, '{}', NULL, false, false),
	('8578b4a5-f22b-4dfc-9d0b-adfb05c69202', 'Product-Image', 'products/2026/80e21646-54e7-4ac5-ae35-12f5ff41b739.png', NULL, '2026-06-11 14:31:16.041052+00', '2026-06-11 14:31:16.041052+00', '2026-06-11 14:31:16.041052+00', '{"eTag": "\"0b572716046a7701df1e833c55318707\"", "size": 392564, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-11T14:31:17.000Z", "contentLength": 392564, "httpStatusCode": 200}', '36b9e4ad-8019-4655-bfb2-9eefd8ba2a26', NULL, '{}', NULL, false, false),
	('b0c5b4a3-c595-47e6-8155-87d52db2c3a2', 'Category-Image', 'vegetable.png', NULL, '2026-04-08 13:11:24.64746+00', '2026-04-08 13:11:24.64746+00', '2026-04-08 13:11:24.64746+00', '{"eTag": "\"b84d6e74d48fc8e374e8bf5c88377658-1\"", "size": 6272, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-08T13:11:25.000Z", "contentLength": 6272, "httpStatusCode": 200}', '77068103-283e-48a6-85da-44f6a91b3ce9', NULL, NULL, NULL, false, false),
	('050d41cf-a600-43b2-93d2-5c9ce77c52bf', 'Category-Image', 'categories/2026/2994b02f-db6c-46fa-ac23-70c1d326c373.png', NULL, '2026-04-24 09:35:17.547071+00', '2026-04-24 09:35:17.547071+00', '2026-04-24 09:35:17.547071+00', '{"eTag": "\"fa0f6b8b0d285e42c5c0f0a914b75391\"", "size": 389127, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-24T09:35:18.000Z", "contentLength": 389127, "httpStatusCode": 200}', '0ec9239c-b2f2-4145-83d5-c7160993f912', NULL, '{}', NULL, false, false),
	('0f184e67-d934-4f53-a425-c3a4426a7c9b', 'Product-Image', 'products/2026/3430372c-ee22-4a33-9bd7-a05314afd181.png', NULL, '2026-06-11 14:28:10.708048+00', '2026-06-11 14:28:10.708048+00', '2026-06-11 14:28:10.708048+00', '{"eTag": "\"b7eea954265c88151741ba175afe2d2e\"", "size": 1551549, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-11T14:28:11.000Z", "contentLength": 1551549, "httpStatusCode": 200}', 'efb88e89-24b2-4a96-92a2-9080fee5aa21', NULL, '{}', NULL, false, false),
	('45ac006d-0026-4eb6-86f6-89e0f33d5b40', 'General', 'IconText.png', NULL, '2026-04-08 14:31:09.506653+00', '2026-04-08 14:31:17.14198+00', '2026-04-08 14:31:09.506653+00', '{"eTag": "\"76a8369cf2565c36105a7ad93d3cc599\"", "size": 42827, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-08T14:31:18.000Z", "contentLength": 42827, "httpStatusCode": 200}', 'e4818b92-a118-41c9-a637-cd58b839f136', NULL, NULL, NULL, false, false),
	('907f4487-295a-48ee-bdb3-c27e03bfb92d', 'Category-Image', 'categories/2026/b9412769-1eaa-4450-aca3-c8a19b2f409c.png', NULL, '2026-04-24 09:39:56.761919+00', '2026-04-24 09:39:56.761919+00', '2026-04-24 09:39:56.761919+00', '{"eTag": "\"70482fafcb093ff90a83ab75b84fcbb2\"", "size": 53219, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-24T09:39:57.000Z", "contentLength": 53219, "httpStatusCode": 200}', '434cdcbc-4fd6-464c-8e8b-b6f585f13ee8', NULL, '{}', NULL, false, false),
	('b7f23d77-5ce5-4355-a20b-9c1cb48e0574', 'Category-Image', 'categories/2026/238e7d43-9567-46c5-a040-f904a1f0177e.gif', NULL, '2026-05-20 18:25:53.371807+00', '2026-05-20 18:25:53.371807+00', '2026-05-20 18:25:53.371807+00', '{"eTag": "\"42cea054b3bf1a4bb2dd51b1ba93ec55\"", "size": 1244667, "mimetype": "image/gif", "cacheControl": "max-age=3600", "lastModified": "2026-05-20T18:25:54.000Z", "contentLength": 1244667, "httpStatusCode": 200}', '45b59dbe-2339-4e13-8040-e82776bfc899', NULL, '{}', NULL, false, false),
	('8f63eabb-f940-4caf-86d8-d05c7ebfebb2', 'User_Images', 'Admin.jfif', NULL, '2026-04-08 18:45:35.612795+00', '2026-04-08 18:45:41.514434+00', '2026-04-08 18:45:35.612795+00', '{"eTag": "\"03ce6fe52caa4f2073d266fa370e7466\"", "size": 6733, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-04-08T18:45:42.000Z", "contentLength": 6733, "httpStatusCode": 200}', 'b2604a11-e3c1-4fb6-80ef-961efd22518d', NULL, NULL, NULL, false, false),
	('e3d8dcf7-aea8-4123-b77b-10fcd129585d', 'Product-Image', 'biaheinekein.png', NULL, '2026-04-09 10:12:59.124442+00', '2026-04-09 10:12:59.124442+00', '2026-04-09 10:12:59.124442+00', '{"eTag": "\"3b1d7441712a651fe4608eb9cb782450-1\"", "size": 30535, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-09T10:12:59.000Z", "contentLength": 30535, "httpStatusCode": 200}', 'f25894dc-b16b-4331-893d-0a41924062a8', NULL, NULL, NULL, false, false),
	('f61ae0bd-9dd7-4259-8e45-416f73de0a5b', 'Product-Image', 'lavie500ml.jpg', NULL, '2026-04-09 10:12:59.127378+00', '2026-04-09 10:12:59.127378+00', '2026-04-09 10:12:59.127378+00', '{"eTag": "\"de69bebc509814e2513b8a8bc09eaa55-1\"", "size": 42146, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-04-09T10:12:59.000Z", "contentLength": 42146, "httpStatusCode": 200}', 'a3d7f885-b16b-4fb9-b5bf-0170547a3379', NULL, NULL, NULL, false, false),
	('011d2333-1863-49b2-aadb-10d8fd00b813', 'Product-Image', 'nuocmamnamngu.png', NULL, '2026-04-09 10:12:59.29364+00', '2026-04-09 10:12:59.29364+00', '2026-04-09 10:12:59.29364+00', '{"eTag": "\"5bdbdd64517337094647c0150398ae22-1\"", "size": 20060, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-09T10:12:59.000Z", "contentLength": 20060, "httpStatusCode": 200}', '1eecde79-2922-4e05-8d03-405cb69012f1', NULL, NULL, NULL, false, false),
	('5c6b5c35-ca03-49c0-9cb7-f1676f9dc174', 'Product-Image', 'keodua.jfif', NULL, '2026-04-09 10:12:59.383186+00', '2026-04-09 10:12:59.383186+00', '2026-04-09 10:12:59.383186+00', '{"eTag": "\"d53e547e564aa266e177c4cd8ff10862-1\"", "size": 8248, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-04-09T10:12:59.000Z", "contentLength": 8248, "httpStatusCode": 200}', 'e1c54621-a991-4c33-84a2-82dac4cff057', NULL, NULL, NULL, false, false),
	('da4eb902-d5ed-4e40-bab7-a09bbc481e62', 'Product-Image', 'yenmach.png', NULL, '2026-04-09 10:13:00.459887+00', '2026-04-09 10:13:00.459887+00', '2026-04-09 10:13:00.459887+00', '{"eTag": "\"d7e1234ca0da64e6732ef38b9d91777f-1\"", "size": 629077, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-09T10:13:00.000Z", "contentLength": 629077, "httpStatusCode": 200}', '262f5668-3158-43d6-8e0d-b8f5a204f37a', NULL, NULL, NULL, false, false),
	('db057be6-00a0-4f2c-a466-be1d3cb35f33', 'Product-Image', 'caphe.png', NULL, '2026-04-09 10:14:25.420879+00', '2026-04-09 10:14:25.420879+00', '2026-04-09 10:14:25.420879+00', '{"eTag": "\"a37c61a1f9a60270d0982d93c1c98698-1\"", "size": 564949, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-09T10:14:26.000Z", "contentLength": 564949, "httpStatusCode": 200}', '4ec7a529-3f5a-4807-ac4d-7a1ead2bcea0', NULL, NULL, NULL, false, false),
	('e47bc58a-007a-439a-bfad-555edda782ee', 'Product-Image', 'mutdautaydalat.png', NULL, '2026-04-09 10:14:25.435595+00', '2026-04-09 10:14:25.435595+00', '2026-04-09 10:14:25.435595+00', '{"eTag": "\"4468b7228d9cfe7b94d65c8b46c6285c-1\"", "size": 444628, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-09T10:14:26.000Z", "contentLength": 444628, "httpStatusCode": 200}', '57c30da4-ffbc-4cf7-8ac5-0fb2b9c7e254', NULL, NULL, NULL, false, false),
	('3969340c-1ef6-48a3-88ac-f0b7efd877db', 'Product-Image', 'socoladen.png', NULL, '2026-04-09 10:14:25.44313+00', '2026-04-09 10:14:25.44313+00', '2026-04-09 10:14:25.44313+00', '{"eTag": "\"430e441447767a3b35931f8180137234-1\"", "size": 68531, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-09T10:14:26.000Z", "contentLength": 68531, "httpStatusCode": 200}', '558e51da-cd52-4af9-9fed-867ff6718bbd', NULL, NULL, NULL, false, false),
	('a0fad29e-3fc3-45cf-af09-9206d75d4fc0', 'Product-Image', 'banhquybodanisa.png', NULL, '2026-04-09 10:14:25.454339+00', '2026-04-09 10:14:25.454339+00', '2026-04-09 10:14:25.454339+00', '{"eTag": "\"08a600a424ba0d5f3388fa8c4c4fbcc6-1\"", "size": 1199349, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-09T10:14:26.000Z", "contentLength": 1199349, "httpStatusCode": 200}', '1b1bea63-c8c1-4f1b-a5df-4335bd8126a2', NULL, NULL, NULL, false, false),
	('537d4523-1e67-429a-852b-dbd9c258fa3c', 'Product-Image', 'haohaothung.png', NULL, '2026-04-09 10:14:25.463783+00', '2026-04-09 10:14:25.463783+00', '2026-04-09 10:14:25.463783+00', '{"eTag": "\"7574cb26ec276fe3a942200860271cba-1\"", "size": 702767, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-09T10:14:26.000Z", "contentLength": 702767, "httpStatusCode": 200}', '20f01238-ee8d-4867-bc91-9147f0803d27', NULL, NULL, NULL, false, false),
	('151a816b-7cf1-4151-a272-88ee9bbf3f93', 'Product-Image', 'products/2026/cc760d68-8d24-48b1-9974-a5af9a560a50.png', NULL, '2026-06-11 14:28:53.106548+00', '2026-06-11 14:28:53.106548+00', '2026-06-11 14:28:53.106548+00', '{"eTag": "\"12d2d7f9aadef311a1238da521632576\"", "size": 366890, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-11T14:28:54.000Z", "contentLength": 366890, "httpStatusCode": 200}', 'fb0235f6-4608-414e-b86b-203f2ddf80d3', NULL, '{}', NULL, false, false),
	('a88ec15a-d1df-4c59-bb33-c26d5843031d', 'Product-Image', 'products/2026/540d11ca-e083-4a60-821d-a027c984a490.png', NULL, '2026-04-24 09:48:10.533938+00', '2026-04-24 09:48:10.533938+00', '2026-04-24 09:48:10.533938+00', '{"eTag": "\"9caf2238e5f718ffecbf9907e1b19874\"", "size": 392940, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-24T09:48:11.000Z", "contentLength": 392940, "httpStatusCode": 200}', '6b09462e-20a3-4422-a9f0-51d7215a2a82', NULL, '{}', NULL, false, false),
	('73f5727b-2b11-4e59-bbdd-eec8b4ad10fa', 'Product-Image', 'products/2026/71a77f5c-48fc-44aa-8fb4-5dcf3a632527.gif', NULL, '2026-05-20 18:26:27.488101+00', '2026-05-20 18:26:27.488101+00', '2026-05-20 18:26:27.488101+00', '{"eTag": "\"42cea054b3bf1a4bb2dd51b1ba93ec55\"", "size": 1244667, "mimetype": "image/gif", "cacheControl": "max-age=3600", "lastModified": "2026-05-20T18:26:28.000Z", "contentLength": 1244667, "httpStatusCode": 200}', 'b3d9d0db-eb6d-40c1-adda-fc7c473e4dfe', NULL, '{}', NULL, false, false),
	('b43d62dd-7409-4b22-8d5b-77a0b885aced', 'General', 'products.png', NULL, '2026-05-20 18:27:31.042112+00', '2026-05-20 18:27:31.042112+00', '2026-05-20 18:27:31.042112+00', '{"eTag": "\"5b339c8d9cdd066ae7ea00c06f6a9eec-1\"", "size": 417230, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-05-20T18:27:31.000Z", "contentLength": 417230, "httpStatusCode": 200}', 'fc64d526-ed26-4451-bd28-fb5456541d1d', NULL, NULL, NULL, false, false),
	('f211e4fa-06a8-47d3-a477-b1b76305ee8d', 'Product-Image', 'products/2026/1efe488c-9628-4978-bc88-cc43f817323f.png', NULL, '2026-06-11 14:30:54.537087+00', '2026-06-11 14:30:54.537087+00', '2026-06-11 14:30:54.537087+00', '{"eTag": "\"8a59423b6898686302a3f4616dc1ecf1\"", "size": 444757, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-11T14:30:55.000Z", "contentLength": 444757, "httpStatusCode": 200}', 'd797d535-5799-4777-b515-acd53e8d82ad', NULL, '{}', NULL, false, false),
	('5137306c-3d7c-4745-9d61-7494e7188fd0', 'User_Images', 'f374c5bf-ed02-4793-bbd8-dae9ca816a36/1781163976974-13034b8c5a498.png', NULL, '2026-06-11 07:46:17.776075+00', '2026-06-11 07:46:17.776075+00', '2026-06-11 07:46:17.776075+00', '{"eTag": "\"59457a8339f76a1f4a689a8c2cece407\"", "size": 202787, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-11T07:46:18.000Z", "contentLength": 202787, "httpStatusCode": 200}', '0e10eb37-a948-4dc0-92f4-885f0df2e553', NULL, '{}', NULL, false, false),
	('700e2d1c-e088-4e2d-ad52-928381b6bd2f', 'User_Images', 'f374c5bf-ed02-4793-bbd8-dae9ca816a36/1781164002039-f8c2753e833a5.png', NULL, '2026-06-11 07:46:42.645205+00', '2026-06-11 07:46:42.645205+00', '2026-06-11 07:46:42.645205+00', '{"eTag": "\"59457a8339f76a1f4a689a8c2cece407\"", "size": 202787, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-11T07:46:43.000Z", "contentLength": 202787, "httpStatusCode": 200}', '1b5bacf7-12d6-4f06-83a8-4a3ea9581ce6', NULL, '{}', NULL, false, false),
	('46f03dfa-44e6-4841-a279-188eddf30bfb', 'Product-Image', 'products/2026/563e7c2d-202c-44b4-93ed-92e13d7e585a.png', NULL, '2026-06-11 14:31:32.115548+00', '2026-06-11 14:31:32.115548+00', '2026-06-11 14:31:32.115548+00', '{"eTag": "\"9f89af874bb787a8f836d2f0b1bf8ce1\"", "size": 993781, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-11T14:31:33.000Z", "contentLength": 993781, "httpStatusCode": 200}', '31b8f60c-d302-45f5-a31b-2d5719f3f8d2', NULL, '{}', NULL, false, false),
	('861b1238-8e40-450e-af88-dc03f8f9a84a', 'User_Images', 'f374c5bf-ed02-4793-bbd8-dae9ca816a36/1781164406078-e289de4b26437.png', NULL, '2026-06-11 07:53:26.860423+00', '2026-06-11 07:53:26.860423+00', '2026-06-11 07:53:26.860423+00', '{"eTag": "\"59457a8339f76a1f4a689a8c2cece407\"", "size": 202787, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-11T07:53:27.000Z", "contentLength": 202787, "httpStatusCode": 200}', '0ce24ee0-91ba-4ae8-abfb-19adefe42ffc', NULL, '{}', NULL, false, false),
	('3d288616-d4b9-4cc7-ad1c-48eb7e5822d2', 'Product-Image', 'products/2026/df3eed28-1c27-42ff-b1d5-8c6026c9d2f8.png', NULL, '2026-06-11 14:32:18.99533+00', '2026-06-11 14:32:18.99533+00', '2026-06-11 14:32:18.99533+00', '{"eTag": "\"ddb68cba5ae2b06deef1b3953bf405a4\"", "size": 554313, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-11T14:32:19.000Z", "contentLength": 554313, "httpStatusCode": 200}', '6bb3e516-84e2-4087-b4c3-b57b6d64670c', NULL, '{}', NULL, false, false),
	('6da5cbba-bc55-418a-a73a-c4a30d4106ea', 'Product-Image', 'products/2026/a8bd3fcf-5bbc-44a1-982d-235a221c7a3a.png', NULL, '2026-06-15 15:19:59.19296+00', '2026-06-15 15:19:59.19296+00', '2026-06-15 15:19:59.19296+00', '{"eTag": "\"006dfe1a3a197aea489b93f70955d4de\"", "size": 766813, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-15T15:20:00.000Z", "contentLength": 766813, "httpStatusCode": 200}', '32b5ccc6-29a0-4b50-bae7-468faa2495b2', NULL, '{}', NULL, false, false),
	('8de0d31b-840f-4bd5-9f99-d0d1fe0b0ee3', 'Product-Image', 'products/2026/9cad4e44-9b49-4060-a017-1322e3f9931a.png', NULL, '2026-06-15 15:20:44.629758+00', '2026-06-15 15:20:44.629758+00', '2026-06-15 15:20:44.629758+00', '{"eTag": "\"51689dbad3af4c47c27752ed89574977\"", "size": 436681, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-15T15:20:45.000Z", "contentLength": 436681, "httpStatusCode": 200}', '403c0787-d8b9-42e9-bd22-5b84b8d734d9', NULL, '{}', NULL, false, false),
	('3a537cb1-b17e-406c-8d10-488850e54a3d', 'Product-Image', 'dauansimply.png', NULL, '2026-04-09 10:14:25.478989+00', '2026-04-09 10:14:25.478989+00', '2026-04-09 10:14:25.478989+00', '{"eTag": "\"fdc6ab2556330f13ab05645a6a137d69-1\"", "size": 258022, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-09T10:14:26.000Z", "contentLength": 258022, "httpStatusCode": 200}', '43d32c15-f6c0-4e7d-8dce-0875cb79e010', NULL, NULL, NULL, false, false),
	('55892a1e-40b1-4854-8321-6d89c0482db1', 'Product-Image', 'suatuoi.png', NULL, '2026-04-09 10:14:25.512485+00', '2026-04-09 10:14:25.512485+00', '2026-04-09 10:14:25.512485+00', '{"eTag": "\"027eb0dc23c32a061ceb300157f86d94-1\"", "size": 353992, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-09T10:14:26.000Z", "contentLength": 353992, "httpStatusCode": 200}', '685434a3-e28e-4409-b885-db96f95ff3e4', NULL, NULL, NULL, false, false),
	('358f424d-d155-4614-b77e-a50aa0888775', 'Product-Image', 'products/2026/abe25add-022b-48e2-acb8-cee1a3406ed7.png', NULL, '2026-06-11 14:31:51.580862+00', '2026-06-11 14:31:51.580862+00', '2026-06-11 14:31:51.580862+00', '{"eTag": "\"a16f3be2d897aa48fb9f49f4162dbe9e\"", "size": 650017, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-11T14:31:52.000Z", "contentLength": 650017, "httpStatusCode": 200}', '03b3783b-2d39-4ae6-b2e1-4e2bcfe4adc5', NULL, '{}', NULL, false, false),
	('2aa6d6b2-678c-4c68-98ef-a11b733e9bfb', 'User_Images', 'users/2026/a7d17956-e02a-4f3c-82b6-9fd1f5470898.png', NULL, '2026-04-24 12:51:45.770272+00', '2026-04-24 12:51:45.770272+00', '2026-04-24 12:51:45.770272+00', '{"eTag": "\"e9659dfb27f4663595830044e7a8a0dc\"", "size": 872091, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-24T12:51:46.000Z", "contentLength": 872091, "httpStatusCode": 200}', '473e4990-0134-42bf-9230-3e2eccf967c7', NULL, '{}', NULL, false, false),
	('3d9b3a4e-4fab-409e-b5fa-f685a8e2f1d0', 'Product-Image', 'taofuji.jpg', NULL, '2026-04-09 10:14:26.239517+00', '2026-04-09 10:14:26.239517+00', '2026-04-09 10:14:26.239517+00', '{"eTag": "\"2273d1d52e129169df03950d0194bc8e-1\"", "size": 122329, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-04-09T10:14:26.000Z", "contentLength": 122329, "httpStatusCode": 200}', '49ed770b-46f1-41cf-8472-bb35727a8a13', NULL, NULL, NULL, false, false),
	('3fd08a5a-dab3-4576-9fcb-18205b73e40d', 'Product-Image', 'tuongotchinsu.png', NULL, '2026-04-09 10:14:26.345199+00', '2026-04-09 10:14:26.345199+00', '2026-04-09 10:14:26.345199+00', '{"eTag": "\"5bee7a9ee6cdc265e340a82f35a9621b-1\"", "size": 222004, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-09T10:14:26.000Z", "contentLength": 222004, "httpStatusCode": 200}', '7012cb76-ba1c-4de6-b127-d03b148e5950', NULL, NULL, NULL, false, false),
	('0a0994b0-2b41-4830-894c-66063b01a85d', 'Category-Image', 'categories/2026/4efeb2b6-d482-4629-9b7c-4bb0fb168ff6.png', NULL, '2026-04-24 12:58:07.654108+00', '2026-04-24 12:58:07.654108+00', '2026-04-24 12:58:07.654108+00', '{"eTag": "\"fa0f6b8b0d285e42c5c0f0a914b75391\"", "size": 389127, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-24T12:58:08.000Z", "contentLength": 389127, "httpStatusCode": 200}', '02479a1b-7a79-4dce-ab90-6c4b5a9f1ba6', NULL, '{}', NULL, false, false),
	('b0c9db2a-8e49-4d21-bf32-e103b395ad63', 'Product-Image', 'products/2026/6bc12b9d-2857-451a-add2-10e97b33c6fc.png', NULL, '2026-06-11 14:32:24.647727+00', '2026-06-11 14:32:24.647727+00', '2026-06-11 14:32:24.647727+00', '{"eTag": "\"253fdd7eee9eded4915ee618f4cd5f73\"", "size": 448025, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-11T14:32:25.000Z", "contentLength": 448025, "httpStatusCode": 200}', '1842a389-1bc4-463e-9b51-72c42dcb5d7f', NULL, '{}', NULL, false, false),
	('45dd92ff-7e12-49d3-a9fc-a434c5200bb4', 'General', 'products (1).png', NULL, '2026-05-20 18:28:25.675578+00', '2026-05-20 18:28:25.675578+00', '2026-05-20 18:28:25.675578+00', '{"eTag": "\"44f1d3541a4f838984260da83359ac3d-1\"", "size": 85463, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-05-20T18:28:26.000Z", "contentLength": 85463, "httpStatusCode": 200}', 'b7d046a5-103e-4aac-ac7c-305d62c34c12', NULL, NULL, NULL, false, false),
	('5ccd8f3a-cc3f-497d-b1f1-c66af25cb201', 'User_Images', 'f374c5bf-ed02-4793-bbd8-dae9ca816a36/1781163988337-ddbf45f371708.png', NULL, '2026-06-11 07:46:29.192157+00', '2026-06-11 07:46:29.192157+00', '2026-06-11 07:46:29.192157+00', '{"eTag": "\"6bccb6ac0d226e8fe7303a852851d9c1\"", "size": 223495, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-11T07:46:30.000Z", "contentLength": 223495, "httpStatusCode": 200}', '95bacd65-4ce5-441c-982c-89c04b12d2ee', NULL, '{}', NULL, false, false),
	('ece2b1a2-c060-40ae-b765-7891344f4c89', 'Product-Image', 'products/2026/0c0dc00a-21bf-4172-a7b7-d56810cb2517.png', NULL, '2026-06-15 15:21:19.141106+00', '2026-06-15 15:21:19.141106+00', '2026-06-15 15:21:19.141106+00', '{"eTag": "\"11c3d21aa52941cfe7e61490bfd2ea6b\"", "size": 197186, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-15T15:21:20.000Z", "contentLength": 197186, "httpStatusCode": 200}', '56fdb55c-d24b-4a0e-b0be-55d694ee7c1c', NULL, '{}', NULL, false, false),
	('70e703f5-8efd-43d7-ae58-e2ed0d2a0f06', 'Product-Image', 'products/2026/bf0c9879-17c8-4283-bd52-df263a6888e6.png', NULL, '2026-06-15 15:22:02.468898+00', '2026-06-15 15:22:02.468898+00', '2026-06-15 15:22:02.468898+00', '{"eTag": "\"ab101e7c10d91900ba6b0b63c7d5eff0\"", "size": 118341, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-15T15:22:03.000Z", "contentLength": 118341, "httpStatusCode": 200}', '73cdac83-6e0a-48b4-bb0b-eceeddde0a6a', NULL, '{}', NULL, false, false),
	('8dc8e27f-1e54-4db6-a189-02ceaab298ee', 'Product-Image', 'products/2026/b58b58f5-28b9-433e-8f4f-ab0e182fd1c7.png', NULL, '2026-06-15 15:23:06.454548+00', '2026-06-15 15:23:06.454548+00', '2026-06-15 15:23:06.454548+00', '{"eTag": "\"2c9095615ae21ea3c7e3023df89c53e6\"", "size": 754921, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-15T15:23:07.000Z", "contentLength": 754921, "httpStatusCode": 200}', '43a48908-0b8a-4d7a-98e8-ec50f7218fa8', NULL, '{}', NULL, false, false),
	('e8d9bb41-4a3a-47d3-85cd-c13721388309', 'Product-Image', 'caithie.png', NULL, '2026-04-09 10:14:25.59377+00', '2026-04-09 10:14:25.59377+00', '2026-04-09 10:14:25.59377+00', '{"eTag": "\"b9c66449829cc404af00d437ed715922-1\"", "size": 438291, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-09T10:14:26.000Z", "contentLength": 438291, "httpStatusCode": 200}', 'ba743447-ff7b-4498-b56a-841a3a93af9f', NULL, NULL, NULL, false, false),
	('ecbd2c01-495d-466a-813f-802a66c226c0', 'Product-Image', 'sunlight.png', NULL, '2026-04-09 10:14:25.644947+00', '2026-04-09 10:14:25.644947+00', '2026-04-09 10:14:25.644947+00', '{"eTag": "\"40c33c0ed0447d0ef8da7708880cdc6c-1\"", "size": 110164, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-09T10:14:26.000Z", "contentLength": 110164, "httpStatusCode": 200}', '33503190-14a3-4831-bdaf-40bc2cc5a935', NULL, NULL, NULL, false, false),
	('3aa53dc7-4560-4b5b-aecb-2826502abe27', 'Product-Image', 'products/2026/c568ef04-89a4-4840-8cb2-2414d01e4237.png', NULL, '2026-04-24 12:56:53.022655+00', '2026-04-24 12:56:53.022655+00', '2026-04-24 12:56:53.022655+00', '{"eTag": "\"9caf2238e5f718ffecbf9907e1b19874\"", "size": 392940, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-24T12:56:54.000Z", "contentLength": 392940, "httpStatusCode": 200}', 'ddd3f68a-573e-47ea-a17c-00a843217dd1', NULL, '{}', NULL, false, false),
	('c00d7c9d-52c4-49cd-ac1a-98f72ca3221e', 'Product-Image', 'xucxichvissan.png', NULL, '2026-04-09 10:14:26.225438+00', '2026-04-09 10:14:26.225438+00', '2026-04-09 10:14:26.225438+00', '{"eTag": "\"7ac469b009642eea877af59032dd1850-1\"", "size": 404427, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-09T10:14:26.000Z", "contentLength": 404427, "httpStatusCode": 200}', '67432db9-4bd5-439e-abeb-230e0eb57b70', NULL, NULL, NULL, false, false),
	('7e609afd-adca-4594-995e-b20f03bc946d', 'Product-Image', 'thitbachiheo.png', NULL, '2026-04-09 10:14:26.231414+00', '2026-04-09 10:14:26.231414+00', '2026-04-09 10:14:26.231414+00', '{"eTag": "\"ca1ef28b42ed7bf17e730af753c8306e-1\"", "size": 245482, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-09T10:14:26.000Z", "contentLength": 245482, "httpStatusCode": 200}', 'ea869c72-cc51-433e-b9e8-01cebdd0d5ac', NULL, NULL, NULL, false, false),
	('a059d24a-e512-40c8-9383-1ee458f0bb8d', 'Product-Image', 'products/2026/c4f713fa-0095-454e-8150-9b05221f8f12.png', NULL, '2026-06-15 15:19:12.219636+00', '2026-06-15 15:19:12.219636+00', '2026-06-15 15:19:12.219636+00', '{"eTag": "\"c264ec4016fe39d2c74b5dbda5866ab2\"", "size": 96908, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-15T15:19:13.000Z", "contentLength": 96908, "httpStatusCode": 200}', 'e2458ab4-afc9-41e6-ab5f-f003f50855b5', NULL, '{}', NULL, false, false),
	('c94bc09d-d29e-476c-bf2a-b6d11631389e', 'User_Images', 'users/2026/7a78db24-54c0-4471-9e94-7d8a31bf4431.png', NULL, '2026-05-21 14:40:09.32664+00', '2026-05-21 14:40:09.32664+00', '2026-05-21 14:40:09.32664+00', '{"eTag": "\"4c23cfb64c177d0cdc240cc9952c7806\"", "size": 135643, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-05-21T14:40:10.000Z", "contentLength": 135643, "httpStatusCode": 200}', '2f34cfce-3ae5-4ba7-8312-fc872ce37e4c', NULL, '{}', NULL, false, false),
	('870eb142-4b79-4a73-83b2-4ce76cb32f4e', 'Post-Attachment', 'f374c5bf-ed02-4793-bbd8-dae9ca816a36/51fc0771-2fbb-4a98-85ee-8f830eba0515/1781172977773-237d3c9cc151d.png', NULL, '2026-06-11 10:16:19.123743+00', '2026-06-11 10:16:19.123743+00', '2026-06-11 10:16:19.123743+00', '{"eTag": "\"ab77c7e37ec84e669737fdbeb0e65070\"", "size": 3526115, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-11T10:16:20.000Z", "contentLength": 3526115, "httpStatusCode": 200}', '9ef34942-30ac-4558-aa4c-5354f04e2895', NULL, '{}', NULL, false, false),
	('abde70f0-0900-401b-8c42-4da21281d4ad', 'Product-Image', 'products/2026/9f23a318-e498-418a-a935-cd62a827e08b.png', NULL, '2026-06-15 15:19:35.685401+00', '2026-06-15 15:19:35.685401+00', '2026-06-15 15:19:35.685401+00', '{"eTag": "\"091d1534be615ab633e651908d0f82a7\"", "size": 671986, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-15T15:19:36.000Z", "contentLength": 671986, "httpStatusCode": 200}', '154500b7-98d4-4d9b-ab0c-e16f5f6ed348', NULL, '{}', NULL, false, false),
	('96f878ec-d9f4-4dcb-b01b-2b615b8caee0', 'Post-Attachment', 'f374c5bf-ed02-4793-bbd8-dae9ca816a36/51fc0771-2fbb-4a98-85ee-8f830eba0515/1781172979006-2fae1e820bd66.png', NULL, '2026-06-11 10:16:19.498238+00', '2026-06-11 10:16:19.498238+00', '2026-06-11 10:16:19.498238+00', '{"eTag": "\"9148994f3a25b929003cd35d25b37549\"", "size": 948593, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-11T10:16:20.000Z", "contentLength": 948593, "httpStatusCode": 200}', '6b5f33d3-962c-4b9d-ba23-62b235991f65', NULL, '{}', NULL, false, false),
	('10270b96-2ddc-4aba-adec-ef610f76c4b8', 'Product-Image', 'products/2026/1e588ea4-3bf9-47f3-9f46-0081fef7d5c3.png', NULL, '2026-06-15 15:20:20.873271+00', '2026-06-15 15:20:20.873271+00', '2026-06-15 15:20:20.873271+00', '{"eTag": "\"1eecf110d6c5ff69560c709ffa1b58ae\"", "size": 698102, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-15T15:20:21.000Z", "contentLength": 698102, "httpStatusCode": 200}', 'ce46c6f6-f619-4937-80a9-147061ba9f13', NULL, '{}', NULL, false, false),
	('bf81a866-80af-417c-92ec-3d936c8ee3a3', 'Product-Image', 'products/2026/88c93c4f-e247-4461-b88f-bb0d6c6742c0.png', NULL, '2026-06-15 15:23:57.855582+00', '2026-06-15 15:23:57.855582+00', '2026-06-15 15:23:57.855582+00', '{"eTag": "\"088bfd378f410a41f15706f55963914b\"", "size": 89060, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-15T15:23:58.000Z", "contentLength": 89060, "httpStatusCode": 200}', '0013396b-54e4-4c1a-9f3e-0fe4caa8b8f8', NULL, '{}', NULL, false, false),
	('12a77dac-6fd5-4df5-9541-0a1067e725a2', 'Product-Image', 'products/2026/80fcc6b1-27c6-42ad-9bf9-cb5c8bacae1e.png', NULL, '2026-06-15 15:24:05.259771+00', '2026-06-15 15:24:05.259771+00', '2026-06-15 15:24:05.259771+00', '{"eTag": "\"c53a614a09aae23c1bee25719ae0a375\"", "size": 77581, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-15T15:24:06.000Z", "contentLength": 77581, "httpStatusCode": 200}', '02b0a824-26a8-4613-bc27-25f285d6e3cb', NULL, '{}', NULL, false, false),
	('481e25d2-63cb-4b1d-bbb8-fb8f36be5649', 'Product-Image', 'products/2026/f8350148-8a92-42d1-8914-be448fad6fd1.png', NULL, '2026-06-15 15:24:31.203182+00', '2026-06-15 15:24:31.203182+00', '2026-06-15 15:24:31.203182+00', '{"eTag": "\"35faec0ca8447c398403c7666c8c069e\"", "size": 553561, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-15T15:24:32.000Z", "contentLength": 553561, "httpStatusCode": 200}', '0b103319-8ffb-4ee9-9860-eabcbc8f6ebc', NULL, '{}', NULL, false, false),
	('bc920432-e744-4272-b993-6cccdc307175', 'Product-Image', 'products/2026/792661fb-0b8f-49af-ac7d-776335d3b1a3.png', NULL, '2026-06-15 15:26:11.772748+00', '2026-06-15 15:26:11.772748+00', '2026-06-15 15:26:11.772748+00', '{"eTag": "\"030aaa190ebc13d844a8cc74a3dfa5c4\"", "size": 157900, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-15T15:26:12.000Z", "contentLength": 157900, "httpStatusCode": 200}', 'f3582836-c2d7-4111-a774-37745500bcaa', NULL, '{}', NULL, false, false),
	('44262801-eb5b-4448-9c6d-cb667b115cdf', 'Product-Image', 'products/2026/a894edec-79c3-44f9-9887-5bd6eaaaa92e.png', NULL, '2026-06-15 15:27:05.684104+00', '2026-06-15 15:27:05.684104+00', '2026-06-15 15:27:05.684104+00', '{"eTag": "\"a8aab8ca3a8ca955a7bab4845481cf4f\"", "size": 1790563, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-15T15:27:06.000Z", "contentLength": 1790563, "httpStatusCode": 200}', '043caa83-4689-4190-97f9-0e65ead61ec3', NULL, '{}', NULL, false, false),
	('c6d38eec-78b2-46c9-a281-ff9fa3410e48', 'Product-Image', 'products/2026/aef1ce0d-2dca-405c-a2d5-15c954965c72.png', NULL, '2026-06-15 15:27:33.095722+00', '2026-06-15 15:27:33.095722+00', '2026-06-15 15:27:33.095722+00', '{"eTag": "\"0690402d5cf9a3945ed3a51cf8bcd9df\"", "size": 93289, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-15T15:27:34.000Z", "contentLength": 93289, "httpStatusCode": 200}', 'd171d7d6-adad-4f8f-9e45-d5220ebc1e3d', NULL, '{}', NULL, false, false),
	('42e563bf-a765-438f-adb2-1074b9644a31', 'Product-Image', 'products/2026/4e75ac12-4c93-456f-b7df-4e86b2905ca2.png', NULL, '2026-06-15 15:28:00.538726+00', '2026-06-15 15:28:00.538726+00', '2026-06-15 15:28:00.538726+00', '{"eTag": "\"21a8baaaf7b178086720ad7c86a4a16f\"", "size": 109966, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-15T15:28:01.000Z", "contentLength": 109966, "httpStatusCode": 200}', 'f1a290bf-5ce4-485a-80b2-16607b1893f6', NULL, '{}', NULL, false, false),
	('12950837-44d5-4728-a41b-86eae1bb0e79', 'Product-Image', 'products/2026/589799ea-1d53-4a3f-85f9-38827111a88d.png', NULL, '2026-06-15 15:28:42.266542+00', '2026-06-15 15:28:42.266542+00', '2026-06-15 15:28:42.266542+00', '{"eTag": "\"068fbb12f1e825f72167fc32331e5f8d\"", "size": 675407, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-15T15:28:43.000Z", "contentLength": 675407, "httpStatusCode": 200}', '19745a3f-b007-4710-8d45-22d1b9d40374', NULL, '{}', NULL, false, false),
	('7c990be4-7138-4442-8a1a-e2a41bd44956', 'Product-Image', 'products/2026/bcaecf92-eec8-4cf7-897f-59eb3e061687.png', NULL, '2026-06-15 15:24:43.187419+00', '2026-06-15 15:24:43.187419+00', '2026-06-15 15:24:43.187419+00', '{"eTag": "\"1d2d9c83a9aabeb99ac928172f8baf3d\"", "size": 2352144, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-15T15:24:44.000Z", "contentLength": 2352144, "httpStatusCode": 200}', 'c547a726-f5d4-46d0-adcc-44712bbb53a5', NULL, '{}', NULL, false, false),
	('0e60e528-53d7-4589-bd4b-d57cd1d44330', 'Product-Image', 'products/2026/3025641a-ad9c-4836-91ad-e778907e63a4.png', NULL, '2026-06-15 15:25:28.106184+00', '2026-06-15 15:25:28.106184+00', '2026-06-15 15:25:28.106184+00', '{"eTag": "\"88ccb65ebdf2fe199a4a5eb9afbff768\"", "size": 354565, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-15T15:25:29.000Z", "contentLength": 354565, "httpStatusCode": 200}', 'e8eb2cb4-17e9-431f-a98e-78f1009427f3', NULL, '{}', NULL, false, false),
	('658d886e-0170-413b-b3a9-6cfd93f62c6d', 'Product-Image', 'products/2026/349aecab-65e7-4352-86a6-af5891a25224.png', NULL, '2026-06-15 15:25:39.739801+00', '2026-06-15 15:25:39.739801+00', '2026-06-15 15:25:39.739801+00', '{"eTag": "\"bc539357e55f3cf53d3319a735d9f647\"", "size": 261244, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-15T15:25:40.000Z", "contentLength": 261244, "httpStatusCode": 200}', '528d32fc-4536-4b9a-9425-f4527b0bc489', NULL, '{}', NULL, false, false),
	('cc88429d-c961-4851-9771-5bd8456bc3bb', 'Product-Image', 'products/2026/3d350cd3-fc9d-435d-bac0-a79873071069.png', NULL, '2026-06-15 15:25:59.090484+00', '2026-06-15 15:25:59.090484+00', '2026-06-15 15:25:59.090484+00', '{"eTag": "\"59303a102923159fce1deeed49386161\"", "size": 237023, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-15T15:26:00.000Z", "contentLength": 237023, "httpStatusCode": 200}', '0ddbca48-0c40-434a-af77-74d5b19a8a26', NULL, '{}', NULL, false, false),
	('59b9258d-ed0e-4dc6-98de-72126e675171', 'Product-Image', 'products/2026/207e7790-55b4-4d19-b477-35ae5aee7b11.png', NULL, '2026-06-15 15:26:34.098739+00', '2026-06-15 15:26:34.098739+00', '2026-06-15 15:26:34.098739+00', '{"eTag": "\"a1a261680838540eb6636ac5568e0666\"", "size": 307269, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-15T15:26:35.000Z", "contentLength": 307269, "httpStatusCode": 200}', '00449091-f337-498d-9883-7c36034d924c', NULL, '{}', NULL, false, false),
	('01b95a2c-bfb1-4c54-a884-f7385f2327c9', 'Product-Image', 'products/2026/3ffce7de-ba06-4395-b11a-ab68fdc89330.png', NULL, '2026-06-15 15:26:45.764019+00', '2026-06-15 15:26:45.764019+00', '2026-06-15 15:26:45.764019+00', '{"eTag": "\"efb3fdc8a9f3f4e588641288e1b37d07\"", "size": 78148, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-15T15:26:46.000Z", "contentLength": 78148, "httpStatusCode": 200}', '80b3b38a-3a02-4aa8-8498-8ddb1d6dcc59', NULL, '{}', NULL, false, false),
	('153b0898-147e-4983-b063-f32e0f7b1436', 'Product-Image', 'products/2026/fe311fdc-c9e2-472c-be5f-b00293dc507f.png', NULL, '2026-06-15 15:27:15.994+00', '2026-06-15 15:27:15.994+00', '2026-06-15 15:27:15.994+00', '{"eTag": "\"fbc88c0c6ce20670826e5743c039070c\"", "size": 161162, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-15T15:27:16.000Z", "contentLength": 161162, "httpStatusCode": 200}', '2de35ae8-5862-4beb-b320-85ccd989a6e2', NULL, '{}', NULL, false, false),
	('e4c1ca59-3422-439b-8c98-d85f8508190a', 'Product-Image', 'products/2026/cc18a7f5-17a5-41b7-b812-b46fb334d389.png', NULL, '2026-06-15 15:27:47.964355+00', '2026-06-15 15:27:47.964355+00', '2026-06-15 15:27:47.964355+00', '{"eTag": "\"cdb83ea76045cc0d0d783470f9bd8127\"", "size": 326197, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-15T15:27:48.000Z", "contentLength": 326197, "httpStatusCode": 200}', '1d9f31c0-a3d9-4774-bb61-027e9b842552', NULL, '{}', NULL, false, false),
	('9cc28b4b-a9a4-4e32-9661-3d5095afe2ee', 'Product-Image', 'products/2026/f3f9e7c1-572b-486d-8d8a-964d1c6a4cde.png', NULL, '2026-06-15 15:28:12.367779+00', '2026-06-15 15:28:12.367779+00', '2026-06-15 15:28:12.367779+00', '{"eTag": "\"2f54c0c2075a7708e5c96d2f8516bb61\"", "size": 377779, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-15T15:28:13.000Z", "contentLength": 377779, "httpStatusCode": 200}', '9bb0f962-ad26-4d92-a105-6a664d55f2d1', NULL, '{}', NULL, false, false),
	('1cd2ddd4-cb34-4598-b031-ee36c8fe473b', 'Product-Image', 'products/2026/bc9c30e0-f1ea-4a4f-9018-66f381d61cc5.png', NULL, '2026-06-15 15:28:33.565482+00', '2026-06-15 15:28:33.565482+00', '2026-06-15 15:28:33.565482+00', '{"eTag": "\"e11070f43ea1d5e974434de785d6eea2\"", "size": 502224, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-15T15:28:34.000Z", "contentLength": 502224, "httpStatusCode": 200}', '121831ce-88c7-4b24-b473-e461c1a0c2b0', NULL, '{}', NULL, false, false),
	('5b2c2cc6-c400-4fb6-b602-f94d13518bab', 'Product-Image', 'products/2026/1034da9a-569c-477f-84d2-fc09422ba0d0.png', NULL, '2026-06-15 15:29:04.108142+00', '2026-06-15 15:29:04.108142+00', '2026-06-15 15:29:04.108142+00', '{"eTag": "\"34914f26d80994f686ad23266ed6ac3f\"", "size": 59810, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-15T15:29:05.000Z", "contentLength": 59810, "httpStatusCode": 200}', '8865e2c1-5c12-4c83-81aa-9ea29eb952d0', NULL, '{}', NULL, false, false),
	('f70fbb32-c7a0-4c81-afd2-92a72c9128fa', 'Product-Image', 'products/2026/762b431a-62db-411f-b5ef-082fcb871405.png', NULL, '2026-06-15 15:29:17.098188+00', '2026-06-15 15:29:17.098188+00', '2026-06-15 15:29:17.098188+00', '{"eTag": "\"d247ff8203771f013e518b6f5cb9604a\"", "size": 194911, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-15T15:29:18.000Z", "contentLength": 194911, "httpStatusCode": 200}', 'ee4cd1c7-10e8-4d31-a29c-7e5e5fe7bd2d', NULL, '{}', NULL, false, false),
	('a6dbba64-d3b4-4642-b170-079a6d29673a', 'Product-Image', 'products/2026/af060e55-7d35-4376-af68-765b9ac15640.png', NULL, '2026-06-15 15:29:29.011255+00', '2026-06-15 15:29:29.011255+00', '2026-06-15 15:29:29.011255+00', '{"eTag": "\"9ddfdc8b4d776f1d4b75f7619ad34910\"", "size": 51859, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-15T15:29:30.000Z", "contentLength": 51859, "httpStatusCode": 200}', 'b25247a1-3571-4223-96f6-5155586ff908', NULL, '{}', NULL, false, false),
	('e3ccfed4-4711-477a-91e4-a2f351b4e82e', 'Product-Image', 'products/2026/238abf94-7284-4675-8ae5-6475fc936354.png', NULL, '2026-06-15 15:29:45.436765+00', '2026-06-15 15:29:45.436765+00', '2026-06-15 15:29:45.436765+00', '{"eTag": "\"9b2377dd4a419313694914f0f99da499\"", "size": 321777, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-15T15:29:46.000Z", "contentLength": 321777, "httpStatusCode": 200}', '5b52a6b5-a69b-4a64-8152-44e439f90b21', NULL, '{}', NULL, false, false),
	('4cd48941-fb4f-46c7-8509-b4cac5e0bb31', 'Product-Image', 'products/2026/0f6d4291-1d76-423d-8d11-00dba0ce315b.png', NULL, '2026-06-15 15:29:59.611657+00', '2026-06-15 15:29:59.611657+00', '2026-06-15 15:29:59.611657+00', '{"eTag": "\"f7b69559f5aa608739715afdd771edd0\"", "size": 487532, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-15T15:30:00.000Z", "contentLength": 487532, "httpStatusCode": 200}', 'ae8fbed2-3080-46ee-bfef-e253bb8903b9', NULL, '{}', NULL, false, false),
	('5890a0dc-b6d7-4085-a115-39f2308c9887', 'Product-Image', 'products/2026/a7664b7f-952b-43b6-98ee-29b1a4bc079f.png', NULL, '2026-06-15 15:30:13.115203+00', '2026-06-15 15:30:13.115203+00', '2026-06-15 15:30:13.115203+00', '{"eTag": "\"5acc4a346ea00a1a5c9bbdeb349375e4\"", "size": 158264, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-15T15:30:14.000Z", "contentLength": 158264, "httpStatusCode": 200}', '81dd211e-8ae5-44f3-a3e7-d0b6c639cff8', NULL, '{}', NULL, false, false),
	('17b6bfef-3385-4e78-8c84-da55fa55d222', 'Product-Image', 'products/2026/44f2f3a3-dfb4-4c6d-b9bc-c64f326317bf.png', NULL, '2026-06-15 15:30:25.895589+00', '2026-06-15 15:30:25.895589+00', '2026-06-15 15:30:25.895589+00', '{"eTag": "\"6b391349bf25ec8c28442b4f14bd0ad8\"", "size": 202101, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-15T15:30:26.000Z", "contentLength": 202101, "httpStatusCode": 200}', '4dfcc7a6-2d58-4721-adb7-a4ded0087827', NULL, '{}', NULL, false, false),
	('8c91fa9c-7c11-41bb-b25f-24179b0bae7b', 'Product-Image', 'products/2026/3cb3c110-2f87-4c62-9a42-54d6ac9c4d5e.png', NULL, '2026-06-15 15:30:40.49549+00', '2026-06-15 15:30:40.49549+00', '2026-06-15 15:30:40.49549+00', '{"eTag": "\"5936f1aa1dea13fdbcc54f2a35ed822c\"", "size": 660830, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-15T15:30:41.000Z", "contentLength": 660830, "httpStatusCode": 200}', 'c57957c1-effe-4160-bdf2-c4aaef72cc8e', NULL, '{}', NULL, false, false),
	('781b1edf-c953-48ac-b374-ce86c0bc287a', 'Product-Image', 'products/2026/a4b784df-f13d-4bae-ad40-38fcb60acf71.png', NULL, '2026-06-15 15:30:52.658659+00', '2026-06-15 15:30:52.658659+00', '2026-06-15 15:30:52.658659+00', '{"eTag": "\"bfae1047195dc5f00b831443f9b635bf\"", "size": 321462, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-15T15:30:53.000Z", "contentLength": 321462, "httpStatusCode": 200}', '54f4d993-6713-4078-af47-dcac74bb42dd', NULL, '{}', NULL, false, false),
	('367e40c3-451f-45c8-91a7-92229de87b6b', 'Product-Image', 'products/2026/8d4f17d7-b634-4faa-b006-10e1c921d4dd.png', NULL, '2026-06-15 15:31:24.694703+00', '2026-06-15 15:31:24.694703+00', '2026-06-15 15:31:24.694703+00', '{"eTag": "\"ee22d97bfb36ed6da796b1c264250484\"", "size": 212602, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-15T15:31:25.000Z", "contentLength": 212602, "httpStatusCode": 200}', '09790592-a7c2-434f-9722-2283571ee7be', NULL, '{}', NULL, false, false),
	('64a48bf1-cdc0-4b76-a92d-bc206fc69371', 'Category-Image', 'categories/2026/fcd27dbf-8430-412b-a9d5-2b4a1a7671ce.png', NULL, '2026-06-16 05:59:04.037001+00', '2026-06-16 05:59:04.037001+00', '2026-06-16 05:59:04.037001+00', '{"eTag": "\"bfae1047195dc5f00b831443f9b635bf\"", "size": 321462, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-16T05:59:04.000Z", "contentLength": 321462, "httpStatusCode": 200}', '5689fd42-49f5-4178-bb89-295385eb5513', NULL, '{}', NULL, false, false);


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

-- \unrestrict Mlvim2OqaAwVbl843MNZReEDF2Fr4gb2wfnPZIjfH9zyZvGYkdRX8y0wQbDhWJg

RESET ALL;
