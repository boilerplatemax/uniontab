import {
  FileText,
  Newspaper,
  Info,
  CalendarDays,
  Users,
  Phone,
  Mail,
  Link,
  AlertTriangle,
  Bell,
  Shield,
  Briefcase,
  Scale,
  Heart,
  BookOpen,
  Megaphone,
  DollarSign,
  Vote,
  Home,
  Globe,
} from 'lucide-react';
import React from 'react';

export interface NavIconOption {
  value: string;
  label: string;
  icon: React.ReactNode;
}

export const NAV_ICON_OPTIONS: NavIconOption[] = [
  { value: 'FileText', label: 'Document', icon: <FileText className="h-4 w-4" /> },
  { value: 'Newspaper', label: 'News', icon: <Newspaper className="h-4 w-4" /> },
  { value: 'Info', label: 'Info', icon: <Info className="h-4 w-4" /> },
  { value: 'CalendarDays', label: 'Calendar', icon: <CalendarDays className="h-4 w-4" /> },
  { value: 'Users', label: 'People', icon: <Users className="h-4 w-4" /> },
  { value: 'Phone', label: 'Phone', icon: <Phone className="h-4 w-4" /> },
  { value: 'Mail', label: 'Email', icon: <Mail className="h-4 w-4" /> },
  { value: 'Link', label: 'Link', icon: <Link className="h-4 w-4" /> },
  { value: 'AlertTriangle', label: 'Alert', icon: <AlertTriangle className="h-4 w-4" /> },
  { value: 'Bell', label: 'Bell', icon: <Bell className="h-4 w-4" /> },
  { value: 'Shield', label: 'Shield', icon: <Shield className="h-4 w-4" /> },
  { value: 'Briefcase', label: 'Briefcase', icon: <Briefcase className="h-4 w-4" /> },
  { value: 'Scale', label: 'Legal', icon: <Scale className="h-4 w-4" /> },
  { value: 'Heart', label: 'Heart', icon: <Heart className="h-4 w-4" /> },
  { value: 'BookOpen', label: 'Book', icon: <BookOpen className="h-4 w-4" /> },
  { value: 'Megaphone', label: 'Announce', icon: <Megaphone className="h-4 w-4" /> },
  { value: 'DollarSign', label: 'Finance', icon: <DollarSign className="h-4 w-4" /> },
  { value: 'Vote', label: 'Vote', icon: <Vote className="h-4 w-4" /> },
  { value: 'Home', label: 'Home', icon: <Home className="h-4 w-4" /> },
  { value: 'Globe', label: 'Web', icon: <Globe className="h-4 w-4" /> },
];

// Map from icon name string to React element - used in the navbar for rendering
export function getNavIconByName(name: string | null | undefined, className: string = 'h-4 w-4'): React.ReactNode | null {
  if (!name) return null;

  const iconMap: Record<string, React.ReactNode> = {
    FileText: <FileText className={className} />,
    Newspaper: <Newspaper className={className} />,
    Info: <Info className={className} />,
    CalendarDays: <CalendarDays className={className} />,
    Users: <Users className={className} />,
    Phone: <Phone className={className} />,
    Mail: <Mail className={className} />,
    Link: <Link className={className} />,
    AlertTriangle: <AlertTriangle className={className} />,
    Bell: <Bell className={className} />,
    Shield: <Shield className={className} />,
    Briefcase: <Briefcase className={className} />,
    Scale: <Scale className={className} />,
    Heart: <Heart className={className} />,
    BookOpen: <BookOpen className={className} />,
    Megaphone: <Megaphone className={className} />,
    DollarSign: <DollarSign className={className} />,
    Vote: <Vote className={className} />,
    Home: <Home className={className} />,
    Globe: <Globe className={className} />,
  };

  return iconMap[name] || null;
}
