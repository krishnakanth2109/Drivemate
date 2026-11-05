import React from "react";
import Svg, { Path, Circle, Rect, G } from "react-native-svg";

interface IconProps {
  size?: number;
  color?: string;
}

export const HomeIcon: React.FC<IconProps> = ({ size = 22, color = "#0f172a" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V9.5Z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9 21V12H15V21"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const MessageIcon: React.FC<IconProps> = ({ size = 22, color = "#0f172a" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const BellIcon: React.FC<IconProps> = ({ size = 22, color = "#0f172a" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const WrenchIcon: React.FC<IconProps> = ({ size = 22, color = "#0f172a" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M14.7 6.3C15.6391 5.36087 16.9131 4.83287 18.2413 4.83287C19.5696 4.83287 20.8435 5.36087 21.7826 6.3C22.7217 7.23913 23.2497 8.51305 23.2497 9.8413C23.2497 11.1696 22.7217 12.4435 21.7826 13.3826L19.2 15.9652L14.7 11.4652L17.2826 8.88261"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M14.7 11.4652L6.2 19.9652C5.8287 20.3365 5.32522 20.545 4.8 20.545C4.27478 20.545 3.7713 20.3365 3.4 19.9652L2.03478 18.6C1.66348 18.2287 1.45496 17.7252 1.45496 17.2C1.45496 16.6748 1.66348 16.1713 2.03478 15.8L10.5348 7.30002"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const UserIcon: React.FC<IconProps> = ({ size = 22, color = "#0f172a" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const MenuIcon: React.FC<IconProps> = ({ size = 22, color = "#0f172a" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 12H20" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M4 6H20" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M4 18H20" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const PlusIcon: React.FC<IconProps> = ({ size = 20, color = "#0f172a" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 5V19" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M5 12H19" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const LinkIcon: React.FC<IconProps> = ({ size = 20, color = "#0f172a" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M10 13C10.4299 13.5741 10.9774 14.0491 11.6066 14.3929C12.2357 14.7367 12.9315 14.9411 13.6477 14.9926C14.3639 15.0441 15.0833 14.9414 15.7573 14.6912C16.4313 14.441 17.0434 14.0494 17.554 13.542L20.554 10.542C21.4645 9.59972 21.9672 8.33777 21.954 7.02787C21.9407 5.71798 21.4125 4.46505 20.4828 3.53881C19.5532 2.61258 18.2982 2.0886 16.9882 2.07994C15.6782 2.07128 14.4178 2.57863 13.48 3.493L11.83 5.14"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M14 11C13.5701 10.4259 13.0226 9.95094 12.3934 9.60714C11.7643 9.26335 11.0685 9.05886 10.3523 9.00738C9.63613 8.95589 8.91671 9.05856 8.24273 9.30877C7.56874 9.55897 6.9566 9.95058 6.446 10.458L3.446 13.458C2.53551 14.4003 2.03282 15.6622 2.04604 16.9721C2.05926 18.282 2.5875 19.535 3.51717 20.4612C4.44684 21.3874 5.70183 21.9114 7.01181 21.9201C8.3218 21.9287 9.58223 21.4214 10.52 20.507L12.16 18.86"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const CloseIcon: React.FC<IconProps> = ({ size = 20, color = "#0f172a" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M6 6L18 18" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const HeartIcon: React.FC<IconProps & { filled?: boolean }> = ({ size = 20, color = "#0f172a", filled = false }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : "none"}>
    <Path
      d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const ShareIcon: React.FC<IconProps> = ({ size = 20, color = "#0f172a" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="18" cy="5" r="3" stroke={color} strokeWidth={1.8} />
    <Circle cx="6" cy="12" r="3" stroke={color} strokeWidth={1.8} />
    <Circle cx="18" cy="19" r="3" stroke={color} strokeWidth={1.8} />
    <Path d="M8.59 13.51L15.42 17.49" stroke={color} strokeWidth={1.8} />
    <Path d="M15.41 6.51L8.59 10.49" stroke={color} strokeWidth={1.8} />
  </Svg>
);

export const CreditCardIcon: React.FC<IconProps> = ({ size = 20, color = "#0f172a" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="5" width="20" height="14" rx="3" stroke={color} strokeWidth={1.8} />
    <Path d="M2 10H22" stroke={color} strokeWidth={1.8} />
    <Path d="M6 15H10" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

export const CheckCircleIcon: React.FC<IconProps> = ({ size = 20, color = "#10b981" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.8} />
    <Path d="M8 12L11 15L16 9" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const SparklesIcon: React.FC<IconProps> = ({ size = 20, color = "#0f172a" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2L14.4 7.6L20 10L14.4 12.4L12 18L9.6 12.4L4 10L9.6 7.6L12 2Z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const LogOutIcon: React.FC<IconProps> = ({ size = 20, color = "#ef4444" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M16 17L21 12L16 7" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M21 12H9" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const SearchIcon: React.FC<IconProps> = ({ size = 18, color = "#94a3b8" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth={1.8} />
    <Path d="M21 21L16.65 16.65" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

export const MailIcon: React.FC<IconProps> = ({ size = 18, color = "#94a3b8" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="4" width="18" height="16" rx="3" stroke={color} strokeWidth={1.8} />
    <Path d="M3 7L12 13L21 7" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const LockIcon: React.FC<IconProps> = ({ size = 18, color = "#94a3b8" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="4" y="11" width="16" height="10" rx="3" stroke={color} strokeWidth={1.8} />
    <Path d="M8 11V7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7V11" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    <Circle cx="12" cy="16" r="1.5" fill={color} />
  </Svg>
);

export const PhoneIcon: React.FC<IconProps> = ({ size = 18, color = "#94a3b8" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M22 16.92V19.92C22.0011 20.1986 21.9441 20.4742 21.8325 20.7294C21.7209 20.9846 21.5573 21.2137 21.3521 21.4019C21.1468 21.5902 20.9046 21.7334 20.6407 21.8224C20.3769 21.9114 20.0974 21.9443 19.82 21.92C16.7428 21.5857 13.787 20.5342 11.19 18.85C8.77382 17.3147 6.72533 15.2662 5.18999 12.85C3.49997 10.2412 2.44824 7.27099 2.11999 4.18C2.09577 3.90353 2.12844 3.62489 2.21595 3.36173C2.30346 3.09857 2.44387 2.85664 2.62837 2.65113C2.81287 2.44563 3.03738 2.28109 3.28751 2.16787C3.53764 2.05465 3.80789 1.99527 4.07999 1.9935H7.07999C7.56303 1.98971 8.03153 2.16075 8.39768 2.4744C8.76383 2.78805 9.00139 3.22277 9.06999 3.7C9.19799 4.60699 9.41968 5.49791 9.72999 6.35C9.87053 6.73278 9.89703 7.14771 9.80649 7.54637C9.71594 7.94503 9.51206 8.31119 9.21999 8.6L7.94999 9.87C9.35999 12.35 11.4 14.39 13.88 15.8L15.15 14.53C15.4388 14.2379 15.805 14.034 16.2036 13.9435C16.6023 13.8529 17.0172 13.8794 17.4 14.02C18.2521 14.3303 19.143 14.552 20.05 14.68C20.5332 14.7495 20.9734 14.9922 21.2882 15.3626C21.603 15.733 21.7701 16.2065 21.76 16.69L22 16.92Z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const GoogleLogo: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
      fill="#4285F4"
    />
    <Path
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"
      fill="#34A853"
    />
    <Path
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.16 0 9.94 0 12s.45 3.84 1.24 5.42l4.04-3.15z"
      fill="#FBBC05"
    />
    <Path
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.93 6.72-4.93z"
      fill="#EA4335"
    />
  </Svg>
);

export const ChevronRightIcon: React.FC<IconProps> = ({ size = 18, color = "#a1a1aa" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M9 18L15 12L9 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const ArrowLeftIcon: React.FC<IconProps> = ({ size = 20, color = "#09090b" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12 19L5 12L12 5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const CarIcon: React.FC<IconProps> = ({ size = 20, color = "#09090b" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5 17H19M5 17C4.44772 17 4 16.5523 4 16V11C4 10.4477 4.44772 10 5 10L6.5 6.5C6.79093 5.82116 7.45892 5.37891 8.2 5.37891H15.8C16.5411 5.37891 17.2091 5.82116 17.5 6.5L19 10C19.5523 10 20 10.4477 20 11V16C20 16.5523 19.5523 17 19 17M5 17V19C5 19.5523 5.44772 20 6 20H7C7.55228 20 8 19.5523 8 19V17M19 17V19C19 19.5523 18.5523 20 18 20H17C16.4477 20 16 19.5523 16 19V17"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="7.5" cy="13.5" r="1.5" fill={color} />
    <Circle cx="16.5" cy="13.5" r="1.5" fill={color} />
  </Svg>
);

export const ShieldIcon: React.FC<IconProps> = ({ size = 20, color = "#09090b" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 22S20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const SettingsIcon: React.FC<IconProps> = ({ size = 20, color = "#09090b" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={1.8} />
    <Path
      d="M19.4 15A1.65 1.65 0 0 0 19.73 16.82L20.06 17.15A2 2 0 1 1 17.23 19.98L16.9 19.65A1.65 1.65 0 0 0 15.08 19.32A1.65 1.65 0 0 0 14 20.87V21.5A2 2 0 1 1 10 21.5V20.87A1.65 1.65 0 0 0 8.92 19.32A1.65 1.65 0 0 0 7.1 19.65L6.77 19.98A2 2 0 1 1 3.94 17.15L4.27 16.82A1.65 1.65 0 0 0 4.6 15A1.65 1.65 0 0 0 3.05 13.92H2.5A2 2 0 1 1 2.5 9.92H3.05A1.65 1.65 0 0 0 4.6 8.84A1.65 1.65 0 0 0 4.27 7.02L3.94 6.69A2 2 0 1 1 6.77 3.86L7.1 4.19A1.65 1.65 0 0 0 8.92 4.52A1.65 1.65 0 0 0 10 2.97V2.5A2 2 0 1 1 14 2.5V2.97A1.65 1.65 0 0 0 15.08 4.52A1.65 1.65 0 0 0 16.9 4.19L17.23 3.86A2 2 0 1 1 20.06 6.69L19.73 7.02A1.65 1.65 0 0 0 19.4 8.84A1.65 1.65 0 0 0 20.95 9.92H21.5A2 2 0 1 1 21.5 13.92H20.95A1.65 1.65 0 0 0 19.4 15Z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const HelpCircleIcon: React.FC<IconProps> = ({ size = 20, color = "#09090b" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.8} />
    <Path
      d="M9.09 9A3 3 0 0 1 15 10C15 12 12 13 12 13"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="12" cy="17" r="1" fill={color} />
  </Svg>
);

export const FileTextIcon: React.FC<IconProps> = ({ size = 20, color = "#09090b" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M14 2V8H20" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M16 13H8" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    <Path d="M16 17H8" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    <Path d="M10 9H8" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

export const EditIcon: React.FC<IconProps> = ({ size = 18, color = "#09090b" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M18.5 2.5A2.121 2.121 0 0 1 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const CameraIcon: React.FC<IconProps> = ({ size = 18, color = "#09090b" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="12" cy="13" r="4" stroke={color} strokeWidth={1.8} />
  </Svg>
);

export const TrashIcon: React.FC<IconProps> = ({ size = 18, color = "#ef4444" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 6H5H21" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path
      d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const MotorcycleIcon: React.FC<IconProps> = ({ size = 20, color = "#09090b" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="5.5" cy="17.5" r="3.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="18.5" cy="17.5" r="3.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M15 6L13 11H9L7 6H15Z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M19 17.5L16 11L12 17.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M5.5 17.5L9 11" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M16 6H18" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const MapPinIcon: React.FC<IconProps> = ({ size = 20, color = "#09090b" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const MicIcon: React.FC<IconProps> = ({ size = 20, color = "#09090b" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const PaperclipIcon: React.FC<IconProps> = ({ size = 20, color = "#09090b" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const PlayIcon: React.FC<IconProps> = ({ size = 20, color = "#09090b" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M5 3L19 12L5 21V3Z" fill={color} />
  </Svg>
);

export const PauseIcon: React.FC<IconProps> = ({ size = 20, color = "#09090b" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="6" y="4" width="4" height="16" fill={color} rx="1" />
    <Rect x="14" y="4" width="4" height="16" fill={color} rx="1" />
  </Svg>
);
