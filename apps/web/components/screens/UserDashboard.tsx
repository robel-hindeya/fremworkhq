'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FramSvg, type FramFace } from '@/components/fram/FramSvg';
import { useFram } from '@/components/fram/useFram';
import { api } from '@/lib/api';

interface UserDashboardProps {
  userName: string;
  onLogout: () => void;
  defaultTab?: 'home' | 'events';
}

interface EventItem {
  id: string;
  type: 'WEBINAR' | 'WORKSHOP' | 'MEETUP' | 'OFFICE HOURS';
  title: string;
  description: string;
  length: string;
  whenLabel: string;
  location: string;
}

const DEFAULT_EVENTS: EventItem[] = [
  {
    id: '1',
    type: 'WEBINAR',
    title: 'Live demo: ask your numbers anything',
    description: 'Watch Fremwork answer real finance questions, from cash runway to overdue invoices. Bring your own.',
    length: '45 min',
    whenLabel: 'Fri 20 Nov · 6:00',
    location: 'Online',
  },
  {
    id: '2',
    type: 'WORKSHOP',
    title: 'Close the month faster',
    description: 'A hands-on session for controllers and accountants on reconciling, accruals and the month-end checklist.',
    length: '60 min',
    whenLabel: 'Wed 25 Nov · 2:00',
    location: 'Online',
  },
  {
    id: '3',
    type: 'MEETUP',
    title: 'Finance teams breakfast',
    description: 'Coffee and honest talk about budgets, tools and what keeps finance leads up at night.',
    length: '90 min',
    whenLabel: 'Wed 2 Dec · 1:00',
    location: 'In person · Addis Ababa',
  },
  {
    id: '4',
    type: 'WEBINAR',
    title: 'Budget vs actual, explained',
    description: 'For managers who own a budget but not a finance degree. Plain language, real examples.',
    length: '30 min',
    whenLabel: 'Thu 10 Dec · 3:00',
    location: 'Online',
  },
  {
    id: '5',
    type: 'OFFICE HOURS',
    title: 'Fremwork office hours',
    description: 'Drop in with questions about the product, the waitlist or your setup. No slides.',
    length: 'Weekly',
    whenLabel: 'Every Friday · 4:00',
    location: 'Online',
  },
];

const TAG_BG: Record<string, string> = {
  WEBINAR: '#C6F432',
  WORKSHOP: '#DCE3FF',
  MEETUP: '#FFE7C2',
  'OFFICE HOURS': '#EDEDED',
};

const FILTERS = ['All', 'Webinars', 'Workshops', 'Meetups', 'Office hours'] as const;

// 5 Tech-Focused Categories (NEURA, VOLTX, SYNTX, ORVEX, CYVRA)
interface TechCategory {
  id: string;
  name: string;
  subtitle: string;
  color: string;
  bg: string;
  border: string;
  glow: string;
  svg: React.ReactNode;
}

const TECH_CATEGORIES: TechCategory[] = [
  {
    id: 'neura',
    name: 'NEURA',
    subtitle: 'AI & Data Science',
    color: '#8B5CF6',
    bg: '#F3E8FF',
    border: '#D8B4FE',
    glow: 'rgba(139, 92, 246, 0.4)',
    svg: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="3.2" fill="#8B5CF6" />
        <circle cx="4" cy="7" r="2.2" fill="#A855F7" />
        <circle cx="4" cy="17" r="2.2" fill="#A855F7" />
        <circle cx="20" cy="7" r="2.2" fill="#6366F1" />
        <circle cx="20" cy="17" r="2.2" fill="#6366F1" />
        <circle cx="12" cy="3" r="1.8" fill="#C084FC" />
        <circle cx="12" cy="21" r="1.8" fill="#C084FC" />
        <path d="M6 8l3.6 2.6M6 16l3.6-2.6M14.4 10.6L18 8M14.4 13.4L18 16M12 5v3.8M12 15.2V19M6.2 8.2l3.4 5.2M17.8 8.2l-3.4 5.2" stroke="#8B5CF6" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'voltx',
    name: 'VOLTX',
    subtitle: 'Hardware & Embedded',
    color: '#D97706',
    bg: '#FEF9C3',
    border: '#FDE047',
    glow: 'rgba(234, 179, 8, 0.45)',
    svg: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="4" width="16" height="16" rx="3.5" fill="#FEF08A" stroke="#CA8A04" strokeWidth="1.8" />
        <path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3" stroke="#CA8A04" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M13 7l-4 6h4l-1 5 5-7h-4l1-4z" fill="#EAB308" stroke="#A16207" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'syntx',
    name: 'SYNTX',
    subtitle: 'Software Engineering',
    color: '#2563EB',
    bg: '#DBEAFE',
    border: '#93C5FD',
    glow: 'rgba(37, 99, 235, 0.4)',
    svg: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="3" width="20" height="18" rx="4" fill="#EFF6FF" stroke="#2563EB" strokeWidth="1.8" />
        <path d="M5.5 7h.01M8.5 7h.01M11.5 7h.01" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M6.5 13.5l3 2.5-3 2.5" stroke="#1D4ED8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12.5 18.5h5" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
        <path d="M17.5 11.5l-2-2 2-2" stroke="#60A5FA" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'orvex',
    name: 'ORVEX',
    subtitle: 'Robotics & Aerospace',
    color: '#EA580C',
    bg: '#FFEDD5',
    border: '#FDBA74',
    glow: 'rgba(234, 88, 12, 0.4)',
    svg: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <path d="M12 2C8 5 6 9 6 14c0 2 .5 3.5 1.5 5 1.5-1 3-1.5 4.5-1.5s3 .5 4.5 1.5c1-1.5 1.5-3 1.5-5 0-5-2-9-6-12z" fill="#FED7AA" stroke="#EA580C" strokeWidth="1.8" strokeLinejoin="round" />
        <circle cx="12" cy="10" r="2.5" fill="#EA580C" />
        <path d="M4 14l2 1M20 14l-2 1M9 19l3 3 3-3" stroke="#F97316" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 18v4" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'cyvra',
    name: 'CYVRA',
    subtitle: 'Cybersecurity',
    color: '#059669',
    bg: '#D1FAE5',
    border: '#6EE7B7',
    glow: 'rgba(5, 150, 105, 0.4)',
    svg: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L4 5.5v6c0 5.25 3.4 10.15 8 11.5 4.6-1.35 8-6.25 8-11.5v-6L12 2z" fill="#A7F3D0" stroke="#059669" strokeWidth="1.8" strokeLinejoin="round" />
        <rect x="9.5" y="10" width="5" height="4.5" rx="1" fill="#047857" />
        <path d="M10.5 10V8.5a1.5 1.5 0 0 1 3 0V10" stroke="#047857" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="12" cy="12" r="0.8" fill="#FFFFFF" />
      </svg>
    ),
  },
];

interface ProjectCard {
  id: string;
  title: string;
  category: string;
  time: string;
  badge: string;
  image: string;
}

const RECENT_PROJECTS: ProjectCard[] = [
  {
    id: 'p1',
    title: 'Deep Learning Neural Net Visualizer',
    category: 'NEURA',
    time: 'Edited 2 hours ago',
    badge: 'AI & Data',
    image: '/projects/ai-neural.jpg',
  },
  {
    id: 'p2',
    title: 'ESP32 Telemetry & IoT Sensor Gateway',
    category: 'VOLTX',
    time: 'Edited yesterday',
    badge: 'Hardware',
    image: '/projects/hardware-embedded.jpg',
  },
  {
    id: 'p3',
    title: 'Distributed GraphQL & Edge Microservices',
    category: 'SYNTX',
    time: 'Edited 3 days ago',
    badge: 'Software',
    image: '/projects/software-dev.jpg',
  },
  {
    id: 'p4',
    title: 'Autonomous 6-DOF Drone Flight Planner',
    category: 'ORVEX',
    time: 'Edited last week',
    badge: 'Robotics',
    image: '/projects/robotics-aerospace.jpg',
  },
  {
    id: 'p5',
    title: 'Zero-Trust Packet Firewall & WAF Engine',
    category: 'CYVRA',
    time: 'Edited 2 weeks ago',
    badge: 'Cybersecurity',
    image: '/projects/cybersecurity.jpg',
  },
  {
    id: 'p6',
    title: 'Multi-Modal Data Pipeline & Embeddings',
    category: 'NEURA',
    time: 'Edited 3 weeks ago',
    badge: 'Data Science',
    image: '/projects/data-science.jpg',
  },
];

export function UserDashboard({ userName, onLogout, defaultTab = 'home' }: UserDashboardProps) {
  const fram = useFram('smile');
  const [activeTab, setActiveTab] = useState<'home' | 'events'>(defaultTab);
  const [filter, setFilter] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [registeredIds, setRegisteredIds] = useState<string[]>([]);
  const [modalEvent, setModalEvent] = useState<EventItem | null>(null);
  const [formName, setFormName] = useState<string>(userName || '');
  const [formEmail, setFormEmail] = useState<string>('');
  const [formPhone, setFormPhone] = useState<string>('');
  const [formCompany, setFormCompany] = useState<string>('');
  const [formRole, setFormRole] = useState<string>('Business owner');
  const [formSize, setFormSize] = useState<string>('11–50');
  const [formHeard, setFormHeard] = useState<string>('LinkedIn');
  const [formErr, setFormErr] = useState<string>('');
  const [regSuccessNotice, setRegSuccessNotice] = useState<string>('');

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('fw_user_registered_events');
        if (saved) {
          setRegisteredIds(JSON.parse(saved));
        }
        const userStr = localStorage.getItem('fw_user');
        if (userStr) {
          const u = JSON.parse(userStr);
          if (u.name) setFormName(u.name);
          if (u.email && u.email.includes('@')) setFormEmail(u.email);
          if (u.phone) setFormPhone(u.phone);
          if (u.company) setFormCompany(u.company);
        }
      }
    } catch {}
  }, []);

  const handleOpenRegister = (ev: EventItem) => {
    setModalEvent(ev);
    setFormErr('');
    try {
      if (typeof window !== 'undefined') {
        const rawAdmin = localStorage.getItem('fw_admin_registrations');
        if (rawAdmin) {
          const list = JSON.parse(rawAdmin);
          const existing = list.find((r: any) => r.eventId === ev.id);
          if (existing) {
            if (existing.name) setFormName(existing.name);
            if (existing.email) setFormEmail(existing.email);
            if (existing.phone && existing.phone !== '—') setFormPhone(existing.phone);
            if (existing.company && existing.company !== '—') setFormCompany(existing.company);
            if (existing.role && existing.role !== '—') setFormRole(existing.role);
            if (existing.companySize && existing.companySize !== '—') setFormSize(existing.companySize);
            if (existing.heardFrom && existing.heardFrom !== '—') setFormHeard(existing.heardFrom);
          }
        }
      }
    } catch {}
  };

  const handleCompleteRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormErr('Please enter your full name.');
      return;
    }
    if (!formEmail.trim() || !formEmail.includes('@')) {
      setFormErr('Please enter a valid email address.');
      return;
    }
    if (!formPhone.trim()) {
      setFormErr('Please enter your phone number.');
      return;
    }
    if (!modalEvent) return;

    const ev = modalEvent;
    const newReg = {
      id: Date.now(),
      eventId: ev.id,
      name: formName.trim(),
      email: formEmail.trim(),
      phone: formPhone.trim(),
      company: formCompany.trim() || '—',
      role: formRole || 'Business owner',
      companySize: formSize || '11–50',
      heardFrom: formHeard || 'LinkedIn',
      checkedIn: false,
      createdAt: new Date().toISOString(),
    };

    // 1. Save to fw_admin_registrations so it is immediately visible in Admin (/admin)
    try {
      const rawAdmin = localStorage.getItem('fw_admin_registrations');
      const existing: any[] = rawAdmin ? JSON.parse(rawAdmin) : [];
      const filtered = existing.filter((r) => !(r.eventId === ev.id && r.email.toLowerCase() === newReg.email.toLowerCase()));
      localStorage.setItem('fw_admin_registrations', JSON.stringify([newReg, ...filtered]));
    } catch {}

    // 2. Save to fw_user_registered_events (cards maintain their position without moving!)
    setRegisteredIds((prev) => {
      const next = prev.includes(ev.id) ? prev : [ev.id, ...prev];
      try {
        localStorage.setItem('fw_user_registered_events', JSON.stringify(next));
      } catch {}
      return next;
    });

    // 3. Save to fremwork.registrations for standard sync
    try {
      const curFw = JSON.parse(localStorage.getItem('fremwork.registrations') || '{}');
      curFw[ev.id] = {
        id: newReg.id,
        eventId: ev.id,
        cancelToken: 'local-' + newReg.id,
        answers: {
          name: newReg.name,
          email: newReg.email,
          phone: newReg.phone,
          company: newReg.company,
          role: newReg.role,
          size: newReg.companySize,
          heard: newReg.heardFrom,
        },
      };
      localStorage.setItem('fremwork.registrations', JSON.stringify(curFw));
    } catch {}

    // 4. Try backend API in background if online
    try {
      api(`/events/${ev.id}/registrations`, {
        method: 'POST',
        body: {
          name: newReg.name,
          email: newReg.email,
          phone: newReg.phone,
          company: newReg.company,
          role: newReg.role,
          size: newReg.companySize,
          heard: newReg.heardFrom,
        },
      }).catch(() => {});
    } catch {}

    setRegSuccessNotice(`You're registered for "${ev.title}"!`);
    setTimeout(() => setRegSuccessNotice(''), 3500);
    setModalEvent(null);
  };

  const handleCancelRegistration = (evId: string) => {
    setRegisteredIds((prev) => {
      const next = prev.filter((x) => x !== evId);
      try {
        localStorage.setItem('fw_user_registered_events', JSON.stringify(next));
      } catch {}
      return next;
    });
    try {
      const rawAdmin = localStorage.getItem('fw_admin_registrations');
      if (rawAdmin) {
        const list = JSON.parse(rawAdmin);
        localStorage.setItem('fw_admin_registrations', JSON.stringify(list.filter((r: any) => r.eventId !== evId)));
      }
      const curFw = JSON.parse(localStorage.getItem('fremwork.registrations') || '{}');
      delete curFw[evId];
      localStorage.setItem('fremwork.registrations', JSON.stringify(curFw));
    } catch {}
    setModalEvent(null);
  };

  const downloadCalendarFile = (ev: EventItem) => {
    const mins = parseInt(ev.length, 10) || 60;
    const start = new Date(Date.now() + 3 * 864e5);
    const end = new Date(start.getTime() + mins * 60000);
    const f = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Fremwork//Events//EN',
      'BEGIN:VEVENT',
      `UID:${ev.id}@fremwork`,
      `DTSTAMP:${f(new Date())}`,
      `DTSTART:${f(start)}`,
      `DTEND:${f(end)}`,
      `SUMMARY:${ev.title}`,
      `LOCATION:${ev.location}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `fremwork-${ev.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const filteredEvents = DEFAULT_EVENTS.filter((ev) => {
    if (filter === 'All') return true;
    if (filter === 'Webinars') return ev.type === 'WEBINAR';
    if (filter === 'Workshops') return ev.type === 'WORKSHOP';
    if (filter === 'Meetups') return ev.type === 'MEETUP';
    if (filter === 'Office hours') return ev.type === 'OFFICE HOURS';
    return true;
  });

  const filteredProjects = RECENT_PROJECTS.filter((p) => {
    const matchesCategory =
      selectedCategory === 'all' ||
      p.category.toLowerCase() === selectedCategory.toLowerCase();

    const matchesSearch =
      !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.badge.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const initialLetter = (userName || 'User').trim().charAt(0).toUpperCase();

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        width: '100vw',
        background: '#FAFAF8',
        fontFamily: "'Geist', system-ui, sans-serif",
        color: '#0A0A0A',
        boxSizing: 'border-box',
      }}
    >
      {/* SIDEBAR */}
      <aside
        style={{
          width: '240px',
          flexShrink: 0,
          background: '#FFFFFF',
          borderRight: '1px solid #E6E6E3',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '24px 14px',
          boxSizing: 'border-box',
          position: 'sticky',
          top: 0,
          height: '100vh',
        }}
      >
        <div>
          {/* Brand */}
          <Link
            href="/home"
            onClick={() => setActiveTab('home')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none',
              color: '#0A0A0A',
              fontWeight: 600,
              fontSize: '19px',
              letterSpacing: '-0.03em',
              padding: '6px 10px',
            }}
          >
            {/* Official Fremwork brand logo mark */}
            <img
              src="/brand-logo.png"
              alt="Fremwork"
              width="24"
              height="24"
              style={{ display: 'block', objectFit: 'contain' }}
            />
            Fremwork
          </Link>

          {/* Navigation Items (Welcome button removed per request) */}
          <nav style={{ marginTop: '28px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {/* Home Button */}
            <button
              type="button"
              onClick={() => setActiveTab('home')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '11px 14px',
                borderRadius: '10px',
                border: 'none',
                background: activeTab === 'home' ? '#0A0A0A' : 'transparent',
                color: activeTab === 'home' ? '#FFFFFF' : '#4A4A48',
                fontFamily: 'inherit',
                fontSize: '14px',
                fontWeight: activeTab === 'home' ? 600 : 500,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0 }}
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span>Home</span>
            </button>

            {/* Events Button */}
            <button
              type="button"
              onClick={() => setActiveTab('events')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '11px 14px',
                borderRadius: '10px',
                border: 'none',
                background: activeTab === 'events' ? '#0A0A0A' : 'transparent',
                color: activeTab === 'events' ? '#FFFFFF' : '#4A4A48',
                fontFamily: 'inherit',
                fontSize: '14px',
                fontWeight: activeTab === 'events' ? 600 : 500,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0 }}
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>Events</span>
            </button>
          </nav>
        </div>

        {/* User Card at bottom of sidebar */}
        <div style={{ borderTop: '1px solid #EBEBE8', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 4px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#C6F432',
                color: '#0A0A0A',
                fontWeight: 700,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'inset 0 0 0 1.5px #0A0A0A',
                flexShrink: 0,
              }}
            >
              {initialLetter}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#0A0A0A',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {userName}
              </div>
              <div style={{ fontSize: '12px', color: '#8C8C8C' }}>Member</div>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #E2E2DF',
              background: '#FAFAF8',
              color: '#5E5E5E',
              fontFamily: 'inherit',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Log out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main
        style={{
          flex: 1,
          minWidth: 0,
          height: '100vh',
          overflowY: 'auto',
          boxSizing: 'border-box',
        }}
      >
        {activeTab === 'home' ? (
          /* SIMPLE & MINIMAL TECH DASHBOARD (CANVA STYLE) */
          <div>
            {/* Top Hero Banner with Fremwork brand volt glow & movable Fram */}
            <div
              onMouseMove={fram.onMove}
              onMouseEnter={fram.onEnter}
              onMouseLeave={fram.onLeave}
              style={{
                background: 'radial-gradient(ellipse 85% 70% at 50% 0%, rgba(198, 244, 50, 0.35) 0%, rgba(198, 244, 50, 0.1) 50%, rgba(250, 250, 248, 0) 85%), #FAFAF8',
                padding: '36px 32px 34px',
                textAlign: 'center',
                borderBottom: '1px solid #ECECE8',
                position: 'relative',
              }}
            >
              {/* Movable Fram Character (interactive, follows cursor, blinks & waves) */}
              <div
                style={{
                  display: 'inline-flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: '10px',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
                title="Fram - Click to poke me!"
              >
                <div style={{ width: '92px', height: '78px' }}>
                  <FramSvg
                    f={fram as FramFace}
                    label="Fram, the Fremwork character"
                    svgRef={fram.setFram}
                    onMouseDown={fram.onPoke}
                    style={{
                      display: 'block',
                      width: '100%',
                      height: '100%',
                      overflow: 'visible',
                    }}
                    bob
                  />
                </div>
              </div>

              {/* Title with Fremwork signature volt brand badge */}
              <h1
                style={{
                  fontSize: 'clamp(28px, 4.2vw, 44px)',
                  fontWeight: 600,
                  letterSpacing: '-0.035em',
                  color: '#0A0A0A',
                  margin: '0 0 24px',
                  lineHeight: 1.15,
                }}
              >
                What will you{' '}
                <span
                  style={{
                    background: '#C6F432',
                    padding: '0.04em 0.28em',
                    border: '2.5px solid #0A0A0A',
                    borderRadius: '6px',
                    display: 'inline-block',
                    transform: 'rotate(-2deg)',
                    boxShadow: '2px 2px 0 #0A0A0A',
                    fontWeight: 700,
                  }}
                >
                  build
                </span>{' '}
                today?
              </h1>

              {/* Central Search Bar (Home/Templates sub-pills removed) */}
              <div style={{ maxWidth: '620px', margin: '0 auto', position: 'relative' }}>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#8C8C8C"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)' }}
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Search templates, AI agents, code, or workflows..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 20px 14px 50px',
                    borderRadius: '999px',
                    border: '1.5px solid #D8D8D4',
                    background: '#FFFFFF',
                    fontFamily: 'inherit',
                    fontSize: '15px',
                    color: '#0A0A0A',
                    boxShadow: '0 6px 20px rgba(10,10,10,0.06)',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0A0A0A';
                    e.target.style.boxShadow = '0 0 0 3px rgba(198, 244, 50, 0.5), 0 6px 20px rgba(10,10,10,0.08)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#D8D8D4';
                    e.target.style.boxShadow = '0 6px 20px rgba(10,10,10,0.06)';
                  }}
                />
              </div>
            </div>

            {/* Content Body */}
            <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '32px 36px 60px' }}>
              {/* 5 TECH-FOCUSED CATEGORIES (NEURA, VOLTX, SYNTX, ORVEX, CYVRA) */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'flex-start',
                  gap: 'clamp(14px, 3.5vw, 36px)',
                  marginBottom: '44px',
                  flexWrap: 'wrap',
                }}
              >
                {TECH_CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(isSelected ? 'all' : cat.id)}
                      style={{
                        background: isSelected ? 'rgba(10,10,10,0.04)' : 'transparent',
                        border: 0,
                        padding: '10px 14px',
                        borderRadius: '16px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '10px',
                        minWidth: '120px',
                        transition: 'transform 0.18s cubic-bezier(0.2, 0.8, 0.2, 1), background 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      {/* Colorful Icon Container */}
                      <div
                        style={{
                          width: '62px',
                          height: '62px',
                          borderRadius: '18px',
                          background: cat.bg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: isSelected
                            ? `0 0 0 3px ${cat.color}, 0 8px 24px ${cat.glow}`
                            : '0 3px 12px rgba(10,10,10,0.05)',
                          border: isSelected ? `2.5px solid ${cat.color}` : `1.5px solid ${cat.border}`,
                          transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                          transition: 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
                        }}
                      >
                        {cat.svg}
                      </div>

                      {/* Title & Subtitle */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                        <span
                          style={{
                            fontSize: '13px',
                            fontWeight: 700,
                            letterSpacing: '0.04em',
                            color: isSelected ? cat.color : '#0A0A0A',
                            textAlign: 'center',
                          }}
                        >
                          {cat.name}
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 500,
                            color: '#737373',
                            textAlign: 'center',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {cat.subtitle}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* "Continue building" Row (matches Canva "Continue designing") */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '18px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h2
                      style={{
                        fontSize: '20px',
                        fontWeight: 600,
                        letterSpacing: '-0.02em',
                        color: '#0A0A0A',
                        margin: 0,
                      }}
                    >
                      Continue building
                    </h2>
                    {selectedCategory !== 'all' ? (
                      <span
                        style={{
                          fontSize: '12px',
                          padding: '4px 12px',
                          borderRadius: '999px',
                          background: '#0A0A0A',
                          color: '#C6F432',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span>{TECH_CATEGORIES.find((c) => c.id === selectedCategory)?.name}</span>
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCategory('all');
                          }}
                          style={{ cursor: 'pointer', opacity: 0.8 }}
                          title="Clear filter"
                        >
                          ✕
                        </span>
                      </span>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('all');
                      setSearchQuery('');
                    }}
                    style={{
                      background: 'transparent',
                      border: 0,
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#5E5E5E',
                      cursor: 'pointer',
                      padding: '4px 8px',
                    }}
                  >
                    See all
                  </button>
                </div>

                {/* Project Mockup Cards Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                    gap: '20px',
                  }}
                >
                  {filteredProjects.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #E6E6E3',
                        borderRadius: '14px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.2s ease',
                        boxShadow: '0 2px 8px rgba(10,10,10,0.03)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 12px 28px rgba(10,10,10,0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(10,10,10,0.03)';
                      }}
                    >
                      {/* Top Preview Canvas with Real Tech Image */}
                      <div
                        style={{
                          height: '160px',
                          position: 'relative',
                          overflow: 'hidden',
                          background: '#F0F0ED',
                          borderBottom: '1px solid #ECECE8',
                        }}
                      >
                        <img
                          src={p.image}
                          alt={p.title}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                            transition: 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.06)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        />

                        {/* Top Gradient for subtle contrast */}
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'linear-gradient(180deg, rgba(10,10,10,0.4) 0%, rgba(10,10,10,0) 45%, rgba(10,10,10,0.15) 100%)',
                            pointerEvents: 'none',
                          }}
                        />

                        {/* Category Badge overlay */}
                        <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 1 }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              letterSpacing: '0.04em',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              background: 'rgba(10, 10, 10, 0.78)',
                              backdropFilter: 'blur(8px)',
                              color: '#FFFFFF',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
                              display: 'inline-block',
                            }}
                          >
                            {p.badge}
                          </span>
                        </div>
                      </div>

                      {/* Card Details */}
                      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div
                          style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#0A0A0A',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {p.title}
                        </div>
                        <div
                          style={{
                            fontSize: '12px',
                            color: '#8C8C8C',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <span>{p.category}</span>
                          <span>·</span>
                          <span>{p.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* EVENTS SCREEN (OFFICIAL FREMWORK LAYOUT MATCHING media_1794830602693_31a58826.jpg) */
          <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '36px clamp(16px, 3.5vw, 40px) 64px' }}>
            {/* Registration Success Banner if recently submitted */}
            {regSuccessNotice && (
              <div
                style={{
                  marginBottom: '24px',
                  padding: '12px 18px',
                  borderRadius: '12px',
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  color: '#166534',
                  fontSize: '14px',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{regSuccessNotice}</span>
              </div>
            )}

            {/* HERO SECTION MATCHING media_1794830602693_31a58826.jpg */}
            <section
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '36px 48px',
                marginBottom: '56px',
              }}
            >
              {/* Left headline */}
              <div style={{ flex: '1 1 380px', minWidth: '280px' }}>
                <span
                  style={{
                    fontFamily: "'Geist Mono', monospace",
                    fontSize: '11px',
                    letterSpacing: '0.08em',
                    fontWeight: 600,
                    color: '#0A0A0A',
                    background: '#C6F432',
                    padding: '5px 12px',
                    borderRadius: '999px',
                    textTransform: 'uppercase',
                    display: 'inline-block',
                  }}
                >
                  EVENTS
                </span>
                <h1
                  style={{
                    fontSize: 'clamp(36px, 4.5vw, 56px)',
                    fontWeight: 600,
                    color: '#0A0A0A',
                    letterSpacing: '-0.04em',
                    lineHeight: 1.05,
                    margin: '20px 0 0',
                  }}
                >
                  Run your finance
                  <br />
                  with AI.
                </h1>
                <p
                  style={{
                    margin: '18px 0 0',
                    fontSize: '16px',
                    lineHeight: '26px',
                    color: '#5E5E5E',
                    maxWidth: '440px',
                  }}
                >
                  Live demos, workshops and meetups for business owners and finance teams. Free to join, with time for your questions.
                </p>
              </div>

              {/* Right: NEXT UP Featured Card with Fram */}
              <div
                style={{
                  flex: '1 1 420px',
                  maxWidth: '500px',
                  position: 'relative',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  background: '#F1F1EC',
                  border: '1px solid #E6E6E3',
                  padding: '28px 24px 24px 28px',
                  boxSizing: 'border-box',
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                }}
              >
                {/* radial volt glow */}
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    right: '-20px',
                    top: '-20px',
                    width: '260px',
                    height: '260px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(198,244,50,0.85) 0%, rgba(198,244,50,0.3) 50%, rgba(198,244,50,0) 80%)',
                    filter: 'blur(35px)',
                    pointerEvents: 'none',
                  }}
                />

                <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span
                    style={{
                      fontFamily: "'Geist Mono', monospace",
                      fontSize: '11px',
                      letterSpacing: '0.08em',
                      fontWeight: 500,
                      color: '#5E5E5E',
                      textTransform: 'uppercase',
                    }}
                  >
                    NEXT UP · {DEFAULT_EVENTS[0].type}
                  </span>
                  <h3
                    style={{
                      margin: '4px 0 0',
                      fontSize: '20px',
                      lineHeight: 1.25,
                      fontWeight: 600,
                      color: '#0A0A0A',
                      letterSpacing: '-0.02em',
                      maxWidth: '220px',
                    }}
                  >
                    {DEFAULT_EVENTS[0].title}
                  </h3>
                  <p style={{ margin: '4px 0 16px', fontSize: '13px', color: '#5E5E5E' }}>
                    {DEFAULT_EVENTS[0].whenLabel} · {DEFAULT_EVENTS[0].location}
                  </p>
                  <div>
                    <button
                      type="button"
                      onClick={() => handleOpenRegister(DEFAULT_EVENTS[0])}
                      style={{
                        fontFamily: 'inherit',
                        fontSize: '14px',
                        fontWeight: 500,
                        color: registeredIds.includes(DEFAULT_EVENTS[0].id) ? '#0A0A0A' : '#FFFFFF',
                        background: registeredIds.includes(DEFAULT_EVENTS[0].id) ? '#FFFFFF' : '#0A0A0A',
                        border: '1px solid #0A0A0A',
                        borderRadius: '6px',
                        padding: '9px 18px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!registeredIds.includes(DEFAULT_EVENTS[0].id)) {
                          e.currentTarget.style.background = '#2B2B2B';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!registeredIds.includes(DEFAULT_EVENTS[0].id)) {
                          e.currentTarget.style.background = '#0A0A0A';
                        }
                      }}
                    >
                      {registeredIds.includes(DEFAULT_EVENTS[0].id) ? 'You’re in ✓' : 'Register'}
                    </button>
                  </div>
                </div>

                {/* Fram Character waving on right side */}
                <div
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    width: '130px',
                    flex: 'none',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                  }}
                >
                  <FramSvg f={fram as unknown as FramFace} label="Fram, the Fremwork character, waving hello" className="fram-svg" svgRef={fram.setFram} onMouseDown={fram.onPoke} style={{ display: 'block', width: '100%', height: 'auto', overflow: 'visible' }} />
                </div>
              </div>
            </section>

            {/* UPCOMING EVENTS HEADER + FILTER PILLS (Matching media_1794830602693_31a58826.jpg) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
                marginBottom: '24px',
              }}
            >
              <h2
                style={{
                  fontSize: '24px',
                  fontWeight: 600,
                  letterSpacing: '-0.025em',
                  color: '#0A0A0A',
                  margin: 0,
                }}
              >
                Upcoming events
              </h2>

              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  overflowX: 'auto',
                  paddingBottom: '2px',
                }}
              >
                {FILTERS.map((f) => {
                  const active = filter === f;
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFilter(f)}
                      style={{
                        padding: '7px 16px',
                        borderRadius: '999px',
                        border: active ? '1px solid #0A0A0A' : '1px solid #E6E6E3',
                        background: active ? '#0A0A0A' : '#FFFFFF',
                        color: active ? '#FFFFFF' : '#5E5E5E',
                        fontFamily: 'inherit',
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {f}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* EVENTS GRID - STABLE: CARDS DO NOT MOVE OR REORDER ON REGISTER */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '16px',
              }}
            >
              {filteredEvents.map((ev) => {
                const isReg = registeredIds.includes(ev.id);
                return (
                  <article
                    key={ev.id}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E6E6E3',
                      borderRadius: '16px',
                      padding: '22px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(10,10,10,0.06)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          fontFamily: "'Geist Mono', monospace",
                          fontSize: '11px',
                          letterSpacing: '0.08em',
                          fontWeight: 500,
                          color: '#0A0A0A',
                          background: TAG_BG[ev.type] || '#EDEDED',
                          padding: '4px 9px',
                          borderRadius: '999px',
                        }}
                      >
                        {ev.type}
                      </span>
                      <span style={{ fontSize: '12px', color: '#8C8C8C' }}>{ev.length}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: '20px',
                          lineHeight: 1.25,
                          letterSpacing: '-0.015em',
                          fontWeight: 600,
                          color: '#0A0A0A',
                        }}
                      >
                        {ev.title}
                      </h3>
                      <p
                        style={{
                          margin: 0,
                          fontSize: '14px',
                          lineHeight: '22px',
                          color: '#5E5E5E',
                        }}
                      >
                        {ev.description}
                      </p>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        paddingTop: '14px',
                        borderTop: '1px solid #EDEDED',
                        fontSize: '13px',
                        color: '#3A3A38',
                      }}
                    >
                      <span style={{ fontWeight: 500 }}>{ev.whenLabel}</span>
                      <span style={{ color: '#8C8C8C' }}>{ev.location}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenRegister(ev)}
                      style={{
                        fontFamily: 'inherit',
                        fontSize: '14px',
                        fontWeight: 500,
                        color: isReg ? '#0A0A0A' : '#FFFFFF',
                        background: isReg ? '#FFFFFF' : '#0A0A0A',
                        border: '1px solid #0A0A0A',
                        borderRadius: '6px',
                        padding: '10px 16px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isReg) {
                          e.currentTarget.style.background = '#2B2B2B';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isReg) {
                          e.currentTarget.style.background = '#0A0A0A';
                        }
                      }}
                    >
                      {isReg ? 'You’re in ✓' : 'Register'}
                    </button>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* REGISTRATION FORM MODAL (MATCHING media_1794830606091_e906fb8d.jpg) */}
      {modalEvent && (
        <div
          onClick={() => setModalEvent(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(10,10,10,0.5)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            boxSizing: 'border-box',
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Register for ${modalEvent.title}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '520px',
              maxHeight: 'calc(100vh - 40px)',
              overflowY: 'auto',
              background: '#FFFFFF',
              borderRadius: '24px',
              boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
              boxSizing: 'border-box',
              border: '1px solid #E6E6E3',
            }}
          >
            {/* Close Button */}
            <button
              type="button"
              aria-label="Close"
              onClick={() => setModalEvent(null)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                zIndex: 10,
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#FFFFFF',
                border: '1px solid #E6E6E3',
                color: '#0A0A0A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                transition: 'transform 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M2 2 L12 12 M12 2 L2 12" />
              </svg>
            </button>

            {/* Top Banner with Volt Radial Glow & Dot Pattern */}
            <div
              style={{
                position: 'relative',
                height: '110px',
                overflow: 'hidden',
                borderRadius: '24px 24px 0 0',
                background: '#F7F7F5',
                backgroundImage: 'radial-gradient(#0A0A0A10 1.2px, transparent 1.2px)',
                backgroundSize: '12px 12px',
                padding: '16px 20px',
                boxSizing: 'border-box',
              }}
            >
              {/* Radial volt glow */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: '15%',
                  top: '-40%',
                  width: '70%',
                  height: '180%',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(198,244,50,0.75) 0%, rgba(198,244,50,0.25) 50%, rgba(247,247,245,0) 80%)',
                  filter: 'blur(25px)',
                  pointerEvents: 'none',
                }}
              />

              <span
                style={{
                  position: 'relative',
                  zIndex: 2,
                  fontFamily: "'Geist Mono', monospace",
                  fontSize: '11px',
                  letterSpacing: '0.08em',
                  fontWeight: 600,
                  color: '#0A0A0A',
                  background: TAG_BG[modalEvent.type] || '#C6F432',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  display: 'inline-block',
                }}
              >
                {modalEvent.type}
              </span>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px 28px 32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Event Title */}
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: '24px',
                    lineHeight: 1.2,
                    letterSpacing: '-0.025em',
                    fontWeight: 600,
                    color: '#0A0A0A',
                  }}
                >
                  {modalEvent.title}
                </h2>

                {/* 3 Meta Rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '18px' }}>
                  {/* Calendar Row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        border: '1px solid #E6E6E3',
                        background: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#0A0A0A',
                        flexShrink: 0,
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#0A0A0A' }}>
                        {modalEvent.whenLabel}
                      </div>
                      <div style={{ fontSize: '12px', color: '#8C8C8C' }}>
                        {modalEvent.length}
                      </div>
                    </div>
                  </div>

                  {/* Location Pin Row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        border: '1px solid #E6E6E3',
                        background: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#0A0A0A',
                        flexShrink: 0,
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#0A0A0A' }}>
                        {modalEvent.location}
                      </div>
                      <div style={{ fontSize: '12px', color: '#8C8C8C' }}>
                        Link sent after you register
                      </div>
                    </div>
                  </div>

                  {/* Hosted by Fremwork */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: '#C6F432',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {/* Double vertical frame bars icon */}
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <rect x="5" y="4" width="3" height="10" rx="1.5" fill="#0A0A0A" />
                        <rect x="10" y="4" width="3" height="10" rx="1.5" fill="#0A0A0A" />
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#8C8C8C' }}>
                        Hosted by
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#0A0A0A' }}>
                        Fremwork
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Card Container */}
              <div
                style={{
                  border: '1px solid #E6E6E3',
                  borderRadius: '16px',
                  background: '#FFFFFF',
                  padding: '20px',
                  boxSizing: 'border-box',
                }}
              >
                {registeredIds.includes(modalEvent.id) ? (
                  /* ALREADY REGISTERED VIEW */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: 600, color: '#0A0A0A' }}>
                          Registration Confirmed
                        </div>
                        <div style={{ fontSize: '13px', color: '#5E5E5E', marginTop: '2px' }}>
                          You have a reserved spot for this session.
                        </div>
                      </div>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '999px',
                          background: '#ECFDF3',
                          color: '#027A48',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      >
                        ✓ Registered
                      </span>
                    </div>

                    <div
                      style={{
                        background: '#F7F7F5',
                        borderRadius: '12px',
                        padding: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        fontSize: '13px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#8C8C8C' }}>Name:</span>
                        <span style={{ fontWeight: 500, color: '#0A0A0A' }}>{formName || userName}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#8C8C8C' }}>Email:</span>
                        <span style={{ fontWeight: 500, color: '#0A0A0A' }}>{formEmail || 'user@example.com'}</span>
                      </div>
                      {formPhone && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#8C8C8C' }}>Phone:</span>
                          <span style={{ fontWeight: 500, color: '#0A0A0A' }}>{formPhone}</span>
                        </div>
                      )}
                      {formCompany && formCompany !== '—' && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#8C8C8C' }}>Company:</span>
                          <span style={{ fontWeight: 500, color: '#0A0A0A' }}>{formCompany}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#8C8C8C' }}>Role:</span>
                        <span style={{ fontWeight: 500, color: '#0A0A0A' }}>{formRole}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                      <button
                        type="button"
                        onClick={() => downloadCalendarFile(modalEvent)}
                        style={{
                          flex: 1,
                          padding: '11px 16px',
                          borderRadius: '8px',
                          border: '1px solid #0A0A0A',
                          background: '#0A0A0A',
                          color: '#FFFFFF',
                          fontFamily: 'inherit',
                          fontSize: '13px',
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}
                      >
                        Add to Calendar (.ics)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCancelRegistration(modalEvent.id)}
                        style={{
                          padding: '11px 16px',
                          borderRadius: '8px',
                          border: '1px solid #E6E6E3',
                          background: '#FFFFFF',
                          color: '#B42318',
                          fontFamily: 'inherit',
                          fontSize: '13px',
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* REGISTRATION FORM (MATCHING media_1794830606091_e906fb8d.jpg) */
                  <form onSubmit={handleCompleteRegister} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 600, color: '#0A0A0A' }}>
                        Registration
                      </div>
                      <div style={{ fontSize: '13px', color: '#5E5E5E', marginTop: '3px' }}>
                        Welcome! To join the event, please register below.
                      </div>
                    </div>

                    {/* Full Name */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 500, color: '#0A0A0A' }}>
                        Full name <span style={{ color: '#B42318' }}>*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Andrio John"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        required
                        style={{
                          padding: '11px 14px',
                          border: '1px solid #E2E2DF',
                          borderRadius: '10px',
                          fontSize: '14px',
                          fontFamily: 'inherit',
                          color: '#0A0A0A',
                          outline: 'none',
                          boxSizing: 'border-box',
                          width: '100%',
                          background: '#FFFFFF',
                        }}
                      />
                    </div>

                    {/* Email */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 500, color: '#0A0A0A' }}>
                        Email <span style={{ color: '#B42318' }}>*</span>
                      </label>
                      <input
                        type="email"
                        placeholder="you@company.com"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        required
                        style={{
                          padding: '11px 14px',
                          border: '1px solid #E2E2DF',
                          borderRadius: '10px',
                          fontSize: '14px',
                          fontFamily: 'inherit',
                          color: '#0A0A0A',
                          outline: 'none',
                          boxSizing: 'border-box',
                          width: '100%',
                          background: '#FFFFFF',
                        }}
                      />
                    </div>

                    {/* Phone Number */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 500, color: '#0A0A0A' }}>
                        Phone number <span style={{ color: '#B42318' }}>*</span>
                      </label>
                      <input
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        required
                        style={{
                          padding: '11px 14px',
                          border: '1px solid #E2E2DF',
                          borderRadius: '10px',
                          fontSize: '14px',
                          fontFamily: 'inherit',
                          color: '#0A0A0A',
                          outline: 'none',
                          boxSizing: 'border-box',
                          width: '100%',
                          background: '#FFFFFF',
                        }}
                      />
                    </div>

                    {/* Company */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 500, color: '#0A0A0A' }}>
                        Company
                      </label>
                      <input
                        type="text"
                        placeholder="Your business"
                        value={formCompany}
                        onChange={(e) => setFormCompany(e.target.value)}
                        style={{
                          padding: '11px 14px',
                          border: '1px solid #E2E2DF',
                          borderRadius: '10px',
                          fontSize: '14px',
                          fontFamily: 'inherit',
                          color: '#0A0A0A',
                          outline: 'none',
                          boxSizing: 'border-box',
                          width: '100%',
                          background: '#FFFFFF',
                        }}
                      />
                    </div>

                    {/* Role */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 500, color: '#0A0A0A' }}>
                        What is your role?
                      </label>
                      <div style={{ position: 'relative' }}>
                        <select
                          value={formRole}
                          onChange={(e) => setFormRole(e.target.value)}
                          style={{
                            padding: '11px 36px 11px 14px',
                            border: '1px solid #E2E2DF',
                            borderRadius: '10px',
                            fontSize: '14px',
                            fontFamily: 'inherit',
                            color: '#0A0A0A',
                            outline: 'none',
                            boxSizing: 'border-box',
                            width: '100%',
                            background: '#FFFFFF',
                            appearance: 'none',
                            WebkitAppearance: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <option value="Business owner">Business owner</option>
                          <option value="Finance officer">Finance officer</option>
                          <option value="Analyst">Analyst</option>
                          <option value="Accountant">Accountant</option>
                          <option value="Manager">Manager</option>
                          <option value="Other">Other</option>
                        </select>
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          aria-hidden="true"
                          style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                        >
                          <path d="M2.5 4.5 L6 8 L9.5 4.5" fill="none" stroke="#5E5E5E" strokeWidth="1.6" strokeLinecap="round" />
                        </svg>
                      </div>
                    </div>

                    {/* Company size */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 500, color: '#0A0A0A' }}>
                        Company size
                      </label>
                      <div style={{ position: 'relative' }}>
                        <select
                          value={formSize}
                          onChange={(e) => setFormSize(e.target.value)}
                          style={{
                            padding: '11px 36px 11px 14px',
                            border: '1px solid #E2E2DF',
                            borderRadius: '10px',
                            fontSize: '14px',
                            fontFamily: 'inherit',
                            color: '#0A0A0A',
                            outline: 'none',
                            boxSizing: 'border-box',
                            width: '100%',
                            background: '#FFFFFF',
                            appearance: 'none',
                            WebkitAppearance: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <option value="Just me">Just me</option>
                          <option value="2–10">2–10</option>
                          <option value="11–50">11–50</option>
                          <option value="51–200">51–200</option>
                          <option value="200+">200+</option>
                        </select>
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          aria-hidden="true"
                          style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                        >
                          <path d="M2.5 4.5 L6 8 L9.5 4.5" fill="none" stroke="#5E5E5E" strokeWidth="1.6" strokeLinecap="round" />
                        </svg>
                      </div>
                    </div>

                    {/* How did you hear about this event? */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 500, color: '#0A0A0A' }}>
                        How did you hear about this event?
                      </label>
                      <div style={{ position: 'relative' }}>
                        <select
                          value={formHeard}
                          onChange={(e) => setFormHeard(e.target.value)}
                          style={{
                            padding: '11px 36px 11px 14px',
                            border: '1px solid #E2E2DF',
                            borderRadius: '10px',
                            fontSize: '14px',
                            fontFamily: 'inherit',
                            color: '#0A0A0A',
                            outline: 'none',
                            boxSizing: 'border-box',
                            width: '100%',
                            background: '#FFFFFF',
                            appearance: 'none',
                            WebkitAppearance: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <option value="Friend or colleague">Friend or colleague</option>
                          <option value="LinkedIn">LinkedIn</option>
                          <option value="X (Twitter)">X (Twitter)</option>
                          <option value="Newsletter">Newsletter</option>
                          <option value="Search">Search</option>
                          <option value="Other">Other</option>
                        </select>
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          aria-hidden="true"
                          style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                        >
                          <path d="M2.5 4.5 L6 8 L9.5 4.5" fill="none" stroke="#5E5E5E" strokeWidth="1.6" strokeLinecap="round" />
                        </svg>
                      </div>
                    </div>

                    {/* Error notice */}
                    {formErr ? (
                      <div
                        style={{
                          background: '#FEF2F2',
                          border: '1px solid #FCA5A5',
                          borderRadius: '8px',
                          padding: '10px 14px',
                          color: '#B91C1C',
                          fontSize: '13px',
                        }}
                      >
                        {formErr}
                      </div>
                    ) : null}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      style={{
                        marginTop: '8px',
                        padding: '13px 20px',
                        borderRadius: '999px',
                        border: 'none',
                        background: '#0A0A0A',
                        color: '#FFFFFF',
                        fontSize: '14px',
                        fontWeight: 500,
                        fontFamily: 'inherit',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#2B2B2B';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#0A0A0A';
                      }}
                    >
                      Complete registration
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
