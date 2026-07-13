--
-- PostgreSQL database dump
--

\restrict ovNM96bExQUy2FNib6d3wcQTrAyOWX92WfAdvmNiDQFLOKaccKaq6ziFDVmxhhU

-- Dumped from database version 16.14 (Debian 16.14-1.pgdg13+1)
-- Dumped by pg_dump version 16.14 (Debian 16.14-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Replace any existing content (e.g. rows seeded by migration 0003) so this
-- snapshot loads deterministically into a freshly-migrated schema. None of
-- these tables are referenced by a foreign key, so this is safe.
--

TRUNCATE public.reflections, public.pages, public.themes RESTART IDENTITY;


--
-- Data for Name: pages; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.pages (uri, content, updated_at) VALUES ('about', 'In the middle of a loud and fast-paced world, we invite you to slow down, and take some space. So pause, and align with the divine presence that longs to connect with you.

What you will be invited to reflect on are prayers and reflections from faithful, dedicated lovers of God, who have a deep heart for this world to discover more of Him.

## Definition;

Ruakh

-# noun; verb;

"Breath," "wind," or "spirit." It is the invisible, powerful force that brings life, movement, and divine presence into the world. It is the very breath of God that sustains us.', '2026-07-12 06:39:25.915+00');


--
-- Data for Name: reflections; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.reflections (id, source, attribution, copyright, is_published, created_at, sections) VALUES (6, 'Confessions', 'St. Augustine of Hippo', 'Public Domain', true, '2026-07-03 13:16:03.67189+00', '{"You have made us for yourself, O Lord, and our hearts are restless until they rest in You."}');
INSERT INTO public.reflections (id, source, attribution, copyright, is_published, created_at, sections) VALUES (1, 'Prayer Vol. 02', 'Strahan Coleman', '© Strahan Coleman. Used with permission.', true, '2026-07-02 10:33:17.918544+00', '{"We are with ourselves here in the dark, Father, aware of our vulnerabilities, our needs and mortal limitations.



All we have done today is now left to rest in You, or grow in You, depending on Your will. We have done all we could, yet perhaps not all we should, we trust You now as always, God, with both."}');
INSERT INTO public.reflections (id, source, attribution, copyright, is_published, created_at, sections) VALUES (2, NULL, 'Reinhold Niebuhr', 'Public domain', true, '2026-07-02 10:33:17.918544+00', '{"God, give me grace to accept with serenity the things that cannot be changed, courage to change the things which should be changed, and the wisdom to distinguish the one from the other.



Living one day at a time,
enjoying one moment at a time.

Accepting hardships as the pathway to peace. Taking, as he did, the sinful world as it is, not as I would have it.

Trusting that he will make all things right
if I surrender to His will; that I may be reasonably happy in this life,
and supremely happy with Him forever."}');
INSERT INTO public.reflections (id, source, attribution, copyright, is_published, created_at, sections) VALUES (9, 'Prayer Vol. 02', 'Strahan Coleman', '© Strahan Coleman. Used with permission.', true, '2026-07-12 06:21:44.735467+00', '{"Untame my love.","-# Make my love outrageous, shocking, vulnerable, daring, other seeking, self emptying and long suffering. Make it undeniable, weakness-embracing, fear overcoming and hurt braving. Make it willing and humble, patient and subtle, quiet yet controversial.

-# Make my love a home for the pushed down, the unseen and the trampled-over. Make it hungry and thirsty, then filled to overflowing, always seeking yet never knowing. Make me a person of that kind of love, known for that love, unsatisfied by falling short of that love. Make me a person after Your love, Father, and let that be enough for me."}');
INSERT INTO public.reflections (id, source, attribution, copyright, is_published, created_at, sections) VALUES (11, 'My Utmost for His Highest', 'Oswald Chambers', 'Public Domain', true, '2026-07-13 12:08:22.834372+00', '{"Have you been asking God what He is going to do? He will never tell you. God does not tell you what He is going to do; He reveals to you Who He is."}');
INSERT INTO public.reflections (id, source, attribution, copyright, is_published, created_at, sections) VALUES (12, 'The Pursuit of God', 'A.W. Tozer', '© 1900; A Publisher...', true, '2026-07-13 12:12:21.298855+00', '{"Has it ever occurred to you that one hundred pianos all tuned to the same fork are automatically tuned to each other? They are of one accord by being tuned, not to each other, but to another standard to which each one must individually bow.
So one hundred worshipers met together, each one looking away to Christ, are in heart nearer to each other than they could possibly be, were they to become ''unity'' conscious and turn their eyes away from God to strive for closer fellowship."}');
INSERT INTO public.reflections (id, source, attribution, copyright, is_published, created_at, sections) VALUES (8, 'Prayer Vol. 02', 'Strahan Coleman', '© Strahan Coleman. Used with permission.', true, '2026-07-12 05:21:35.091822+00', '{"I''m learning to discover You, in the minute and ordinary, God. Your kingdom is as miniature as it is vast.




May you have the courage to live a small life - a life that gives up on the hope of grandeur for the quiet knowing that, in God''s economy, less is more.","-# Our culture tends to put its faith in a liturgy of grandeur____It''s as if there is an invisible magnet in the centre of Western life drawing us all invisibly into the false hope of rising up in the strength of our own particular dream or talent to become the individual hero of a grandiose story____The kingdom of heaven is painfully ordinary by comparison____God lives just as much (if not more) in the microscopic - the atom, the unseen breath, the quiet laws of gravity - as He does in the grand____A secret act of kindness, generosity or compassion is God''s version of a ''successful career'', and in His economy, kingdom heroes often remain anonymous to the self-oriented majority____Father, teach me that kind of humility, and help me to be - and to remain - your poor-in-spirit one."}');
INSERT INTO public.reflections (id, source, attribution, copyright, is_published, created_at, sections) VALUES (10, 'The Knowledge of the Holy', 'A.W Tozer / Jeremy Prowse', '© 1900; A Publisher...', true, '2026-07-13 12:00:41.809533+00', '{"What comes into our minds when we think about God is the most important thing about us.



The second is what comes to mind when we think of ourselves.","-# The creator of the cosmos is not an abstract force, or a disconnected deity. He is a person three____Father, Son, Spirit. A relational community of love that perpetually supplies all that is needed for their enjoyment____We have been created in the likeness of this beautiful community, with the same needs that are only met in our creator. You are fearfully and wonderfully made, by a community of loving kindness and selfless generosity____May your heart be open to respond to your reality."}');
INSERT INTO public.reflections (id, source, attribution, copyright, is_published, created_at, sections) VALUES (13, NULL, 'C.S. Lewis', NULL, true, '2026-07-13 12:18:48.918005+00', '{"Some day you will be old enough to start reading fairy tales again.","-# Somewhere along the way, we got \"sensible\". We put dreaming, imagining, believing behind us and settled for rationalism____The One who strew the stars across the galaxies has never ceased to dream though. He spends eternity imagining new wonderful ways to express his creativity and love to his creation____Father, free us from our sensibilities, take us back to a simple way, a child-like way, that trusts, dreams, and imagines beyond the reality our senses have caged us in.

-# - Jeremy Prowse"}');


--
-- Data for Name: themes; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.themes (id, name, bg, line, ink, sort) VALUES (1, 'Sunset', '#f7a31a', '#f5350b', '#000000', 0);
INSERT INTO public.themes (id, name, bg, line, ink, sort) VALUES (2, 'Ocean', '#113757', '#276d8b', '#ffffff', 1);
INSERT INTO public.themes (id, name, bg, line, ink, sort) VALUES (3, 'Midnight', '#1f1f1f', '#292929', '#ffffff', 2);
INSERT INTO public.themes (id, name, bg, line, ink, sort) VALUES (6, 'Coral', '#571df7', '#e2187a', '#f5fafa', 0);
INSERT INTO public.themes (id, name, bg, line, ink, sort) VALUES (7, 'Forest', '#261703', '#134931', '#eff5f2', 0);
INSERT INTO public.themes (id, name, bg, line, ink, sort) VALUES (8, 'Flash', '#f1eee4', '#ffffff', '#1d1c1b', 0);


--
-- Name: reflections_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.reflections_id_seq', 13, true);


--
-- Name: themes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.themes_id_seq', 8, true);


--
-- PostgreSQL database dump complete
--

\unrestrict ovNM96bExQUy2FNib6d3wcQTrAyOWX92WfAdvmNiDQFLOKaccKaq6ziFDVmxhhU

