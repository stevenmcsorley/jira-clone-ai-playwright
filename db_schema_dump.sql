--
-- PostgreSQL database dump
--

\restrict Eq0PdAnIu7bG4qefRoTDCVtopUVYK59qvLSuHLCaa9m9I4aP22yabtbppL1FwUe

-- Dumped from database version 15.14
-- Dumped by pg_dump version 15.14

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
-- Name: estimation_participants_status_enum; Type: TYPE; Schema: public; Owner: jira_clone
--

CREATE TYPE public.estimation_participants_status_enum AS ENUM (
    'invited',
    'joined',
    'voting',
    'voted',
    'left'
);


ALTER TYPE public.estimation_participants_status_enum OWNER TO jira_clone;

--
-- Name: estimation_sessions_estimationscale_enum; Type: TYPE; Schema: public; Owner: jira_clone
--

CREATE TYPE public.estimation_sessions_estimationscale_enum AS ENUM (
    'fibonacci',
    'tshirt',
    'hours',
    'days',
    'power_of_2',
    'linear',
    'modified_fibonacci',
    'story_points'
);


ALTER TYPE public.estimation_sessions_estimationscale_enum OWNER TO jira_clone;

--
-- Name: estimation_sessions_status_enum; Type: TYPE; Schema: public; Owner: jira_clone
--

CREATE TYPE public.estimation_sessions_status_enum AS ENUM (
    'created',
    'waiting',
    'voting',
    'discussing',
    'completed'
);


ALTER TYPE public.estimation_sessions_status_enum OWNER TO jira_clone;

--
-- Name: issue_links_linktype_enum; Type: TYPE; Schema: public; Owner: jira_clone
--

CREATE TYPE public.issue_links_linktype_enum AS ENUM (
    'blocks',
    'blocked_by',
    'duplicates',
    'duplicated_by',
    'relates_to',
    'causes',
    'caused_by',
    'clones',
    'cloned_by',
    'child_of',
    'parent_of'
);


ALTER TYPE public.issue_links_linktype_enum OWNER TO jira_clone;

--
-- Name: issues_priority_enum; Type: TYPE; Schema: public; Owner: jira_clone
--

CREATE TYPE public.issues_priority_enum AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);


ALTER TYPE public.issues_priority_enum OWNER TO jira_clone;

--
-- Name: issues_status_enum; Type: TYPE; Schema: public; Owner: jira_clone
--

CREATE TYPE public.issues_status_enum AS ENUM (
    'todo',
    'in_progress',
    'done'
);


ALTER TYPE public.issues_status_enum OWNER TO jira_clone;

--
-- Name: issues_type_enum; Type: TYPE; Schema: public; Owner: jira_clone
--

CREATE TYPE public.issues_type_enum AS ENUM (
    'story',
    'task',
    'bug',
    'epic'
);


ALTER TYPE public.issues_type_enum OWNER TO jira_clone;

--
-- Name: session_issues_status_enum; Type: TYPE; Schema: public; Owner: jira_clone
--

CREATE TYPE public.session_issues_status_enum AS ENUM (
    'pending',
    'voting',
    'discussing',
    'estimated',
    'skipped'
);


ALTER TYPE public.session_issues_status_enum OWNER TO jira_clone;

--
-- Name: sprints_status_enum; Type: TYPE; Schema: public; Owner: jira_clone
--

CREATE TYPE public.sprints_status_enum AS ENUM (
    'future',
    'active',
    'completed'
);


ALTER TYPE public.sprints_status_enum OWNER TO jira_clone;

--
-- Name: subtasks_status_enum; Type: TYPE; Schema: public; Owner: jira_clone
--

CREATE TYPE public.subtasks_status_enum AS ENUM (
    'todo',
    'in_progress',
    'done'
);


ALTER TYPE public.subtasks_status_enum OWNER TO jira_clone;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: api_tokens; Type: TABLE; Schema: public; Owner: jira_clone
--

CREATE TABLE public.api_tokens (
    id integer NOT NULL,
    token character varying(64) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    "expiresAt" timestamp without time zone,
    "lastUsedAt" timestamp without time zone,
    "isActive" boolean DEFAULT true NOT NULL,
    scopes json DEFAULT '[]'::json NOT NULL,
    "userId" integer NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.api_tokens OWNER TO jira_clone;

--
-- Name: api_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: jira_clone
--

CREATE SEQUENCE public.api_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.api_tokens_id_seq OWNER TO jira_clone;

--
-- Name: api_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jira_clone
--

ALTER SEQUENCE public.api_tokens_id_seq OWNED BY public.api_tokens.id;


--
-- Name: attachments; Type: TABLE; Schema: public; Owner: jira_clone
--

CREATE TABLE public.attachments (
    id integer NOT NULL,
    filename character varying NOT NULL,
    "originalName" character varying NOT NULL,
    "mimeType" character varying NOT NULL,
    size integer NOT NULL,
    path character varying NOT NULL,
    "uploadedById" integer NOT NULL,
    "issueId" integer NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.attachments OWNER TO jira_clone;

--
-- Name: attachments_id_seq; Type: SEQUENCE; Schema: public; Owner: jira_clone
--

CREATE SEQUENCE public.attachments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.attachments_id_seq OWNER TO jira_clone;

--
-- Name: attachments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jira_clone
--

ALTER SEQUENCE public.attachments_id_seq OWNED BY public.attachments.id;


--
-- Name: comments; Type: TABLE; Schema: public; Owner: jira_clone
--

CREATE TABLE public.comments (
    id integer NOT NULL,
    content text NOT NULL,
    "authorId" integer NOT NULL,
    "issueId" integer NOT NULL,
    "parentId" integer,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "isEdited" boolean DEFAULT false NOT NULL,
    "editedAt" timestamp without time zone
);


ALTER TABLE public.comments OWNER TO jira_clone;

--
-- Name: comments_id_seq; Type: SEQUENCE; Schema: public; Owner: jira_clone
--

CREATE SEQUENCE public.comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.comments_id_seq OWNER TO jira_clone;

--
-- Name: comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jira_clone
--

ALTER SEQUENCE public.comments_id_seq OWNED BY public.comments.id;


--
-- Name: estimation_participants; Type: TABLE; Schema: public; Owner: jira_clone
--

CREATE TABLE public.estimation_participants (
    id integer NOT NULL,
    "sessionId" integer NOT NULL,
    "userId" integer NOT NULL,
    status public.estimation_participants_status_enum DEFAULT 'invited'::public.estimation_participants_status_enum NOT NULL,
    "isOnline" boolean DEFAULT false NOT NULL,
    "lastSeenAt" timestamp without time zone,
    "joinedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.estimation_participants OWNER TO jira_clone;

--
-- Name: estimation_participants_id_seq; Type: SEQUENCE; Schema: public; Owner: jira_clone
--

CREATE SEQUENCE public.estimation_participants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.estimation_participants_id_seq OWNER TO jira_clone;

--
-- Name: estimation_participants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jira_clone
--

ALTER SEQUENCE public.estimation_participants_id_seq OWNED BY public.estimation_participants.id;


--
-- Name: estimation_sessions; Type: TABLE; Schema: public; Owner: jira_clone
--

CREATE TABLE public.estimation_sessions (
    id integer NOT NULL,
    name character varying NOT NULL,
    description text,
    status public.estimation_sessions_status_enum DEFAULT 'created'::public.estimation_sessions_status_enum NOT NULL,
    "estimationScale" public.estimation_sessions_estimationscale_enum DEFAULT 'fibonacci'::public.estimation_sessions_estimationscale_enum NOT NULL,
    "anonymousVoting" boolean DEFAULT false NOT NULL,
    "discussionTimeLimit" integer DEFAULT 120 NOT NULL,
    "autoReveal" boolean DEFAULT true NOT NULL,
    "currentIssueId" integer,
    "facilitatorId" integer,
    "projectId" integer NOT NULL,
    "sprintId" integer,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.estimation_sessions OWNER TO jira_clone;

--
-- Name: estimation_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: jira_clone
--

CREATE SEQUENCE public.estimation_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.estimation_sessions_id_seq OWNER TO jira_clone;

--
-- Name: estimation_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jira_clone
--

ALTER SEQUENCE public.estimation_sessions_id_seq OWNED BY public.estimation_sessions.id;


--
-- Name: estimation_votes; Type: TABLE; Schema: public; Owner: jira_clone
--

CREATE TABLE public.estimation_votes (
    id integer NOT NULL,
    "sessionIssueId" integer NOT NULL,
    "voterId" integer NOT NULL,
    estimate numeric(5,2) NOT NULL,
    "estimateText" character varying NOT NULL,
    round integer DEFAULT 1 NOT NULL,
    rationale text,
    "isRevealed" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.estimation_votes OWNER TO jira_clone;

--
-- Name: estimation_votes_id_seq; Type: SEQUENCE; Schema: public; Owner: jira_clone
--

CREATE SEQUENCE public.estimation_votes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.estimation_votes_id_seq OWNER TO jira_clone;

--
-- Name: estimation_votes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jira_clone
--

ALTER SEQUENCE public.estimation_votes_id_seq OWNED BY public.estimation_votes.id;


--
-- Name: issue_links; Type: TABLE; Schema: public; Owner: jira_clone
--

CREATE TABLE public.issue_links (
    id integer NOT NULL,
    "sourceIssueId" integer NOT NULL,
    "targetIssueId" integer NOT NULL,
    "linkType" public.issue_links_linktype_enum NOT NULL,
    "createdById" integer NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.issue_links OWNER TO jira_clone;

--
-- Name: issue_links_id_seq; Type: SEQUENCE; Schema: public; Owner: jira_clone
--

CREATE SEQUENCE public.issue_links_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.issue_links_id_seq OWNER TO jira_clone;

--
-- Name: issue_links_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jira_clone
--

ALTER SEQUENCE public.issue_links_id_seq OWNED BY public.issue_links.id;


--
-- Name: issues; Type: TABLE; Schema: public; Owner: jira_clone
--

CREATE TABLE public.issues (
    id integer NOT NULL,
    title character varying NOT NULL,
    description text,
    status public.issues_status_enum DEFAULT 'todo'::public.issues_status_enum NOT NULL,
    priority public.issues_priority_enum DEFAULT 'medium'::public.issues_priority_enum NOT NULL,
    type public.issues_type_enum DEFAULT 'task'::public.issues_type_enum NOT NULL,
    "projectId" integer NOT NULL,
    "assigneeId" integer,
    "reporterId" integer NOT NULL,
    labels text[] DEFAULT '{}'::text[] NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "epicId" integer,
    "sprintId" integer,
    estimate numeric(5,2),
    "storyPoints" character varying(10)
);


ALTER TABLE public.issues OWNER TO jira_clone;

--
-- Name: issues_id_seq; Type: SEQUENCE; Schema: public; Owner: jira_clone
--

CREATE SEQUENCE public.issues_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.issues_id_seq OWNER TO jira_clone;

--
-- Name: issues_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jira_clone
--

ALTER SEQUENCE public.issues_id_seq OWNED BY public.issues.id;


--
-- Name: projects; Type: TABLE; Schema: public; Owner: jira_clone
--

CREATE TABLE public.projects (
    id integer NOT NULL,
    name character varying NOT NULL,
    key character varying NOT NULL,
    description character varying,
    "leadId" integer NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.projects OWNER TO jira_clone;

--
-- Name: projects_id_seq; Type: SEQUENCE; Schema: public; Owner: jira_clone
--

CREATE SEQUENCE public.projects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.projects_id_seq OWNER TO jira_clone;

--
-- Name: projects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jira_clone
--

ALTER SEQUENCE public.projects_id_seq OWNED BY public.projects.id;


--
-- Name: session_issues; Type: TABLE; Schema: public; Owner: jira_clone
--

CREATE TABLE public.session_issues (
    id integer NOT NULL,
    "sessionId" integer NOT NULL,
    "issueId" integer NOT NULL,
    status public.session_issues_status_enum DEFAULT 'pending'::public.session_issues_status_enum NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    "finalEstimate" numeric(5,2),
    "hasConsensus" boolean DEFAULT false NOT NULL,
    "votingRound" integer DEFAULT 0 NOT NULL,
    "discussionNotes" text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.session_issues OWNER TO jira_clone;

--
-- Name: session_issues_id_seq; Type: SEQUENCE; Schema: public; Owner: jira_clone
--

CREATE SEQUENCE public.session_issues_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.session_issues_id_seq OWNER TO jira_clone;

--
-- Name: session_issues_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jira_clone
--

ALTER SEQUENCE public.session_issues_id_seq OWNED BY public.session_issues.id;


--
-- Name: sprints; Type: TABLE; Schema: public; Owner: jira_clone
--

CREATE TABLE public.sprints (
    id integer NOT NULL,
    name character varying NOT NULL,
    goal text,
    status public.sprints_status_enum DEFAULT 'future'::public.sprints_status_enum NOT NULL,
    "projectId" integer NOT NULL,
    "startDate" timestamp without time zone,
    "endDate" timestamp without time zone,
    "position" integer DEFAULT 0 NOT NULL,
    "createdById" integer NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.sprints OWNER TO jira_clone;

--
-- Name: sprints_id_seq; Type: SEQUENCE; Schema: public; Owner: jira_clone
--

CREATE SEQUENCE public.sprints_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.sprints_id_seq OWNER TO jira_clone;

--
-- Name: sprints_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jira_clone
--

ALTER SEQUENCE public.sprints_id_seq OWNED BY public.sprints.id;


--
-- Name: subtasks; Type: TABLE; Schema: public; Owner: jira_clone
--

CREATE TABLE public.subtasks (
    id integer NOT NULL,
    title character varying NOT NULL,
    completed boolean NOT NULL,
    "issueId" integer NOT NULL,
    "assigneeId" integer,
    "position" integer DEFAULT 0 NOT NULL,
    status public.subtasks_status_enum DEFAULT 'todo'::public.subtasks_status_enum NOT NULL
);


ALTER TABLE public.subtasks OWNER TO jira_clone;

--
-- Name: subtasks_id_seq; Type: SEQUENCE; Schema: public; Owner: jira_clone
--

CREATE SEQUENCE public.subtasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.subtasks_id_seq OWNER TO jira_clone;

--
-- Name: subtasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jira_clone
--

ALTER SEQUENCE public.subtasks_id_seq OWNED BY public.subtasks.id;


--
-- Name: time_logs; Type: TABLE; Schema: public; Owner: jira_clone
--

CREATE TABLE public.time_logs (
    id integer NOT NULL,
    hours numeric(5,2) NOT NULL,
    date timestamp without time zone NOT NULL,
    description text,
    "userId" integer NOT NULL,
    "issueId" integer NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.time_logs OWNER TO jira_clone;

--
-- Name: time_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: jira_clone
--

CREATE SEQUENCE public.time_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.time_logs_id_seq OWNER TO jira_clone;

--
-- Name: time_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jira_clone
--

ALTER SEQUENCE public.time_logs_id_seq OWNED BY public.time_logs.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: jira_clone
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying NOT NULL,
    name character varying NOT NULL,
    avatar character varying,
    password character varying NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO jira_clone;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: jira_clone
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO jira_clone;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jira_clone
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: api_tokens id; Type: DEFAULT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.api_tokens ALTER COLUMN id SET DEFAULT nextval('public.api_tokens_id_seq'::regclass);


--
-- Name: attachments id; Type: DEFAULT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.attachments ALTER COLUMN id SET DEFAULT nextval('public.attachments_id_seq'::regclass);


--
-- Name: comments id; Type: DEFAULT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.comments ALTER COLUMN id SET DEFAULT nextval('public.comments_id_seq'::regclass);


--
-- Name: estimation_participants id; Type: DEFAULT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.estimation_participants ALTER COLUMN id SET DEFAULT nextval('public.estimation_participants_id_seq'::regclass);


--
-- Name: estimation_sessions id; Type: DEFAULT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.estimation_sessions ALTER COLUMN id SET DEFAULT nextval('public.estimation_sessions_id_seq'::regclass);


--
-- Name: estimation_votes id; Type: DEFAULT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.estimation_votes ALTER COLUMN id SET DEFAULT nextval('public.estimation_votes_id_seq'::regclass);


--
-- Name: issue_links id; Type: DEFAULT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.issue_links ALTER COLUMN id SET DEFAULT nextval('public.issue_links_id_seq'::regclass);


--
-- Name: issues id; Type: DEFAULT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.issues ALTER COLUMN id SET DEFAULT nextval('public.issues_id_seq'::regclass);


--
-- Name: projects id; Type: DEFAULT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.projects ALTER COLUMN id SET DEFAULT nextval('public.projects_id_seq'::regclass);


--
-- Name: session_issues id; Type: DEFAULT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.session_issues ALTER COLUMN id SET DEFAULT nextval('public.session_issues_id_seq'::regclass);


--
-- Name: sprints id; Type: DEFAULT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.sprints ALTER COLUMN id SET DEFAULT nextval('public.sprints_id_seq'::regclass);


--
-- Name: subtasks id; Type: DEFAULT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.subtasks ALTER COLUMN id SET DEFAULT nextval('public.subtasks_id_seq'::regclass);


--
-- Name: time_logs id; Type: DEFAULT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.time_logs ALTER COLUMN id SET DEFAULT nextval('public.time_logs_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: subtasks PK_035c1c153f0239ecc95be448d96; Type: CONSTRAINT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.subtasks
    ADD CONSTRAINT "PK_035c1c153f0239ecc95be448d96" PRIMARY KEY (id);


--
-- Name: estimation_sessions PK_28d08e977efbf4d801982278a87; Type: CONSTRAINT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.estimation_sessions
    ADD CONSTRAINT "PK_28d08e977efbf4d801982278a87" PRIMARY KEY (id);


--
-- Name: attachments PK_5e1f050bcff31e3084a1d662412; Type: CONSTRAINT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.attachments
    ADD CONSTRAINT "PK_5e1f050bcff31e3084a1d662412" PRIMARY KEY (id);


--
-- Name: projects PK_6271df0a7aed1d6c0691ce6ac50; Type: CONSTRAINT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT "PK_6271df0a7aed1d6c0691ce6ac50" PRIMARY KEY (id);


--
-- Name: sprints PK_6800aa2e0f508561812c4b9afb4; Type: CONSTRAINT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.sprints
    ADD CONSTRAINT "PK_6800aa2e0f508561812c4b9afb4" PRIMARY KEY (id);


--
-- Name: time_logs PK_8657e6aaa7035da9fc7309f385a; Type: CONSTRAINT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.time_logs
    ADD CONSTRAINT "PK_8657e6aaa7035da9fc7309f385a" PRIMARY KEY (id);


--
-- Name: comments PK_8bf68bc960f2b69e818bdb90dcb; Type: CONSTRAINT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT "PK_8bf68bc960f2b69e818bdb90dcb" PRIMARY KEY (id);


--
-- Name: issue_links PK_92c961bad3a83cebd040a61d87f; Type: CONSTRAINT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.issue_links
    ADD CONSTRAINT "PK_92c961bad3a83cebd040a61d87f" PRIMARY KEY (id);


--
-- Name: issues PK_9d8ecbbeff46229c700f0449257; Type: CONSTRAINT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.issues
    ADD CONSTRAINT "PK_9d8ecbbeff46229c700f0449257" PRIMARY KEY (id);


--
-- Name: users PK_a3ffb1c0c8416b9fc6f907b7433; Type: CONSTRAINT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY (id);


--
-- Name: estimation_votes PK_c3914b4b0bab9b6c10a644a9161; Type: CONSTRAINT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.estimation_votes
    ADD CONSTRAINT "PK_c3914b4b0bab9b6c10a644a9161" PRIMARY KEY (id);


--
-- Name: api_tokens PK_c587455266b5fa8dace7194caac; Type: CONSTRAINT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.api_tokens
    ADD CONSTRAINT "PK_c587455266b5fa8dace7194caac" PRIMARY KEY (id);


--
-- Name: session_issues PK_ccb08d067f41e636a3771096fdd; Type: CONSTRAINT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.session_issues
    ADD CONSTRAINT "PK_ccb08d067f41e636a3771096fdd" PRIMARY KEY (id);


--
-- Name: estimation_participants PK_e51a6d88826e8c93b9b9ff5894f; Type: CONSTRAINT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.estimation_participants
    ADD CONSTRAINT "PK_e51a6d88826e8c93b9b9ff5894f" PRIMARY KEY (id);


--
-- Name: api_tokens UQ_01f4eacf4f2e7a4b4ce4000ce3d; Type: CONSTRAINT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.api_tokens
    ADD CONSTRAINT "UQ_01f4eacf4f2e7a4b4ce4000ce3d" UNIQUE (token);


--
-- Name: projects UQ_63e67599567b2126cfef14e1474; Type: CONSTRAINT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT "UQ_63e67599567b2126cfef14e1474" UNIQUE (key);


--
-- Name: users UQ_97672ac88f789774dd47f7c8be3; Type: CONSTRAINT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE (email);


--
-- Name: issue_links FK_01ca2ac640b31c2063f9a849623; Type: FK CONSTRAINT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.issue_links
    ADD CONSTRAINT "FK_01ca2ac640b31c2063f9a849623" FOREIGN KEY ("createdById") REFERENCES public.users(id);


--
-- Name: issues FK_084190ca006e446a6387baef595; Type: FK CONSTRAINT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.issues
    ADD CONSTRAINT "FK_084190ca006e446a6387baef595" FOREIGN KEY ("reporterId") REFERENCES public.users(id);


--
-- Name: estimation_sessions FK_088460dccecc0c1ae1d27be67fb; Type: FK CONSTRAINT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.estimation_sessions
    ADD CONSTRAINT "FK_088460dccecc0c1ae1d27be67fb" FOREIGN KEY ("facilitatorId") REFERENCES public.users(id);


--
-- Name: estimation_votes FK_0f9eb1ae6e9e2d07d78940eecd9; Type: FK CONSTRAINT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.estimation_votes
    ADD CONSTRAINT "FK_0f9eb1ae6e9e2d07d78940eecd9" FOREIGN KEY ("sessionIssueId") REFERENCES public.session_issues(id) ON DELETE CASCADE;


--
-- Name: sprints FK_12a81f920cc034f4c532766bf18; Type: FK CONSTRAINT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.sprints
    ADD CONSTRAINT "FK_12a81f920cc034f4c532766bf18" FOREIGN KEY ("projectId") REFERENCES public.projects(id);


--
-- Name: estimation_sessions FK_16105100206f0cf8d6dec5cb889; Type: FK CONSTRAINT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.estimation_sessions
    ADD CONSTRAINT "FK_16105100206f0cf8d6dec5cb889" FOREIGN KEY ("projectId") REFERENCES public.projects(id);


--
-- Name: sprints FK_24ac686fca5c960098bf7b4690d; Type: FK CONSTRAINT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.sprints
    ADD CONSTRAINT "FK_24ac686fca5c960098bf7b4690d" FOREIGN KEY ("createdById") REFERENCES public.users(id);


--
-- Name: api_tokens FK_2a2ce819bd75cc0193bfb2692bd; Type: FK CONSTRAINT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.api_tokens
    ADD CONSTRAINT "FK_2a2ce819bd75cc0193bfb2692bd" FOREIGN KEY ("userId") REFERENCES public.users(id);


--
-- Name: issue_links FK_3dc7326c2192861e8206524fcc1; Type: FK CONSTRAINT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.issue_links
    ADD CONSTRAINT "FK_3dc7326c2192861e8206524fcc1" FOREIGN KEY ("targetIssueId") REFERENCES public.issues(id) ON DELETE CASCADE;


--
-- Name: comments FK_4548cc4a409b8651ec75f70e280; Type: FK CONSTRAINT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT "FK_4548cc4a409b8651ec75f70e280" FOREIGN KEY ("authorId") REFERENCES public.users(id);


--
-- Name: session_issues FK_4ded10b53f31af3c8a05ffa540b; Type: FK CONSTRAINT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.session_issues
    ADD CONSTRAINT "FK_4ded10b53f31af3c8a05ffa540b" FOREIGN KEY ("sessionId") REFERENCES public.estimation_sessions(id) ON DELETE CASCADE;


--
-- Name: estimation_sessions FK_5dc78875afc681a8179e668b55b; Type: FK CONSTRAINT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.estimation_sessions
    ADD CONSTRAINT "FK_5dc78875afc681a8179e668b55b" FOREIGN KEY ("sprintId") REFERENCES public.sprints(id);


--
-- Name: projects FK_646afe752c665e1b454a6e0dcc0; Type: FK CONSTRAINT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT "FK_646afe752c665e1b454a6e0dcc0" FOREIGN KEY ("leadId") REFERENCES public.users(id);


--
-- Name: issues FK_712fa796d9dc2e256299d43222b; Type: FK CONSTRAINT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.issues
    ADD CONSTRAINT "FK_712fa796d9dc2e256299d43222b" FOREIGN KEY ("epicId") REFERENCES public.issues(id);


--
-- Name: issue_links FK_7d889d3bfa5d57555d6d817dc67; Type: FK CONSTRAINT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.issue_links
    ADD CONSTRAINT "FK_7d889d3bfa5d57555d6d817dc67" FOREIGN KEY ("sourceIssueId") REFERENCES public.issues(id) ON DELETE CASCADE;


--
-- Name: comments FK_8770bd9030a3d13c5f79a7d2e81; Type: FK CONSTRAINT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT "FK_8770bd9030a3d13c5f79a7d2e81" FOREIGN KEY ("parentId") REFERENCES public.comments(id);


--
-- Name: comments FK_87df5cc9d40c252f38b85618be1; Type: FK CONSTRAINT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT "FK_87df5cc9d40c252f38b85618be1" FOREIGN KEY ("issueId") REFERENCES public.issues(id);


--
-- Name: time_logs FK_8e40a4dd1e3a244dee35cb5a4d5; Type: FK CONSTRAINT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.time_logs
    ADD CONSTRAINT "FK_8e40a4dd1e3a244dee35cb5a4d5" FOREIGN KEY ("issueId") REFERENCES public.issues(id);


--
-- Name: estimation_participants FK_921bf5efa9591997e85aadff9e8; Type: FK CONSTRAINT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.estimation_participants
    ADD CONSTRAINT "FK_921bf5efa9591997e85aadff9e8" FOREIGN KEY ("userId") REFERENCES public.users(id);


--
-- Name: issues FK_9a9187fec2a363ed3bbea2a6b63; Type: FK CONSTRAINT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.issues
    ADD CONSTRAINT "FK_9a9187fec2a363ed3bbea2a6b63" FOREIGN KEY ("assigneeId") REFERENCES public.users(id);


--
-- Name: issues FK_9f82fdfad8087663f95e203da67; Type: FK CONSTRAINT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.issues
    ADD CONSTRAINT "FK_9f82fdfad8087663f95e203da67" FOREIGN KEY ("projectId") REFERENCES public.projects(id);


--
-- Name: attachments FK_a436b9dc8304f58060e905eb705; Type: FK CONSTRAINT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.attachments
    ADD CONSTRAINT "FK_a436b9dc8304f58060e905eb705" FOREIGN KEY ("uploadedById") REFERENCES public.users(id);


--
-- Name: estimation_votes FK_a52e92c247cf45556b2f34c96da; Type: FK CONSTRAINT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.estimation_votes
    ADD CONSTRAINT "FK_a52e92c247cf45556b2f34c96da" FOREIGN KEY ("voterId") REFERENCES public.users(id);


--
-- Name: attachments FK_a771e266d4d0ba5777e2ee94b68; Type: FK CONSTRAINT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.attachments
    ADD CONSTRAINT "FK_a771e266d4d0ba5777e2ee94b68" FOREIGN KEY ("issueId") REFERENCES public.issues(id);


--
-- Name: session_issues FK_a94d1d2b65c3174ea8b074394f9; Type: FK CONSTRAINT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.session_issues
    ADD CONSTRAINT "FK_a94d1d2b65c3174ea8b074394f9" FOREIGN KEY ("issueId") REFERENCES public.issues(id);


--
-- Name: issues FK_aed680c6a19809d2cca92f6d41e; Type: FK CONSTRAINT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.issues
    ADD CONSTRAINT "FK_aed680c6a19809d2cca92f6d41e" FOREIGN KEY ("sprintId") REFERENCES public.sprints(id);


--
-- Name: estimation_participants FK_b52834fe4917df6a0d727d221bf; Type: FK CONSTRAINT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.estimation_participants
    ADD CONSTRAINT "FK_b52834fe4917df6a0d727d221bf" FOREIGN KEY ("sessionId") REFERENCES public.estimation_sessions(id) ON DELETE CASCADE;


--
-- Name: subtasks FK_c0b95ff44a46461a2f88944ceb2; Type: FK CONSTRAINT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.subtasks
    ADD CONSTRAINT "FK_c0b95ff44a46461a2f88944ceb2" FOREIGN KEY ("issueId") REFERENCES public.issues(id);


--
-- Name: subtasks FK_d7cb66de8c03ad9835a52c6b3ad; Type: FK CONSTRAINT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.subtasks
    ADD CONSTRAINT "FK_d7cb66de8c03ad9835a52c6b3ad" FOREIGN KEY ("assigneeId") REFERENCES public.users(id);


--
-- Name: time_logs FK_ffe67877eaeba4e553d64610a37; Type: FK CONSTRAINT; Schema: public; Owner: jira_clone
--

ALTER TABLE ONLY public.time_logs
    ADD CONSTRAINT "FK_ffe67877eaeba4e553d64610a37" FOREIGN KEY ("userId") REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict Eq0PdAnIu7bG4qefRoTDCVtopUVYK59qvLSuHLCaa9m9I4aP22yabtbppL1FwUe

