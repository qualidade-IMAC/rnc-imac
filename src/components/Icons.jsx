import React from 'react';

export const SvgIcon = ({ children, size = 24, className = "", strokeWidth = 2, title }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    {title && <title>{title}</title>}
    {children}
  </svg>
);

export const Printer = (p) => <SvgIcon {...p}><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z" /></SvgIcon>;
export const Edit3 = (p) => <SvgIcon {...p}><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></SvgIcon>;
export const Copy = (p) => <SvgIcon {...p}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></SvgIcon>;
export const ImagePlus = (p) => <SvgIcon {...p}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v4M21 9h-6M18 6v6M3 16l5-5c.928-.893 2.072-.893 3 0l5 5M14 14l1-1c.928-.893 2.072-.893 3 0l3 3" /></SvgIcon>;
export const Trash2 = (p) => <SvgIcon {...p}><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" /></SvgIcon>;
export const FileText = (p) => <SvgIcon {...p}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8" /></SvgIcon>;
export const Users = (p) => <SvgIcon {...p}><path d="M17 21v-2a4 4 0 00-4-4H5c-1.1 0-2 .9-2 2v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></SvgIcon>;
export const ClipboardList = (p) => <SvgIcon {...p}><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2M15 2H9a1 1 0 00-1 1v2a1 1 0 001 1h6a1 1 0 001-1V3a1 1 0 00-1-1zM12 11h4M12 16h4M8 11h.01M8 16h.01" /></SvgIcon>;
export const Upload = (p) => <SvgIcon {...p}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h4M17 8l-5-5-5 5M12 3v12" /></SvgIcon>;
export const Plus = (p) => <SvgIcon {...p}><path d="M12 5v14M5 12h14" /></SvgIcon>;
export const Minus = (p) => <SvgIcon {...p}><line x1="5" y1="12" x2="19" y2="12" /></SvgIcon>;
export const UserX = (p) => <SvgIcon {...p}><path d="M16 21v-2a4 4 0 00-4-4H5c-1.1 0-2 .9-2 2v2M8 7a4 4 0 100 8 4 4 0 000-8zM18 8l4 4M22 8l-4 4" /></SvgIcon>;
export const ArrowUpRight = (p) => <SvgIcon {...p}><path d="M7 17L17 7M7 7h10v10" /></SvgIcon>;
export const Circle = (p) => <SvgIcon {...p}><circle cx="12" cy="12" r="10" /></SvgIcon>;
export const Undo = (p) => <SvgIcon {...p}><path d="M3 7v6h6M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" /></SvgIcon>;
export const Send = (p) => <SvgIcon {...p}><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></SvgIcon>;
export const Archive = (p) => <SvgIcon {...p}><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></SvgIcon>;
export const Check = (p) => <SvgIcon {...p}><path d="M20 6L9 17l-5-5" /></SvgIcon>;
export const X = (p) => <SvgIcon {...p}><path d="M18 6L6 18M6 6l12 12" /></SvgIcon>;
export const PenTool = (p) => <SvgIcon {...p}><path d="M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5zM2 2l7.586 7.586M11 11l2 2" /></SvgIcon>;
export const Move = (p) => <SvgIcon {...p}><path d="M5 9l-3 3 3 3M9 5l3-3 3 3M9 19l3 3-3 3M19 9l3 3-3 3M2 12h20M12 2v20" /></SvgIcon>;
export const TypeIcon = (p) => <SvgIcon {...p}><polyline points="4 7 4 4 20 4 20 7" /><line x1="9" x2="15" y1="20" y2="20" /><line x1="12" x2="12" y1="4" y2="20" /></SvgIcon>;
export const BarChart2 = (p) => <SvgIcon {...p}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></SvgIcon>;
export const BoldIcon = (p) => <SvgIcon {...p} strokeWidth={3}><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></SvgIcon>;
export const ItalicIcon = (p) => <SvgIcon {...p}><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></SvgIcon>;
export const UnderlineIcon = (p) => <SvgIcon {...p}><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></SvgIcon>;
export const Truck = (p) => <SvgIcon {...p}><path d="M16 3H1v13h15M8 16h7v4H8zM21 16h-2v4H5"/><circle cx="6.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></SvgIcon>;
export const ShoppingBag = (p) => <SvgIcon {...p}><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></SvgIcon>;
export const Store = (p) => <SvgIcon {...p}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></SvgIcon>;
export const Eye = (p) => <SvgIcon {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></SvgIcon>;
export const Moon = (p) => <SvgIcon {...p}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></SvgIcon>;
export const Sun = (p) => <SvgIcon {...p}><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></SvgIcon>;
export const Download = (p) => <SvgIcon {...p}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-5M7 10l5 5 5-5M12 15V3"/></SvgIcon>;
export const Filter = (p) => <SvgIcon {...p}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></SvgIcon>;
export const RefreshCw = (p) => <SvgIcon {...p}><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></SvgIcon>;
export const Scissors = (p) => <SvgIcon {...p}><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></SvgIcon>;
export const AlertCircle = (p) => <SvgIcon {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></SvgIcon>;
export const CheckCircle = (p) => <SvgIcon {...p}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></SvgIcon>;
export const Palette = (p) => <SvgIcon {...p}><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></SvgIcon>;
export const LogOut = (p) => <SvgIcon {...p}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></SvgIcon>;
export const ChevronLeft = (p) => <SvgIcon {...p}><polyline points="15 18 9 12 15 6" /></SvgIcon>;
export const ChevronRight = (p) => <SvgIcon {...p}><polyline points="9 18 15 12 9 6" /></SvgIcon>;
export const MessageCircle = (p) => <SvgIcon {...p}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></SvgIcon>;
export const Mail = (p) => <SvgIcon {...p}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></SvgIcon>;
export const Clock = (p) => <SvgIcon {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></SvgIcon>;
export const Lock = (p) => <SvgIcon {...p}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></SvgIcon>;
export const User = (p) => <SvgIcon {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></SvgIcon>;
export const Key = (p) => <SvgIcon {...p}><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" /></SvgIcon>;
export const Settings = (p) => <SvgIcon {...p}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.5a2 2 0 0 1-1 1.72l-.15.1a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0-.73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></SvgIcon>;
