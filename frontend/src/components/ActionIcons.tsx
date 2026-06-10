type IconProps = {
  className?: string;
};

const iconProps = (className?: string) => ({
  "aria-hidden": true,
  className: className ?? "button-icon",
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  strokeWidth: 2,
  viewBox: "0 0 24 24"
});

export const AddIcon = ({ className }: IconProps) => (
  <svg {...iconProps(className)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const DeleteIcon = ({ className }: IconProps) => (
  <svg {...iconProps(className)}>
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v5M14 11v5" />
  </svg>
);

export const FilterIcon = ({ className }: IconProps) => (
  <svg {...iconProps(className)}>
    <path d="M4 5h16l-6.5 7.5V19l-3 1.5v-8Z" />
  </svg>
);

export const ChevronLeftIcon = ({ className }: IconProps) => (
  <svg {...iconProps(className)}>
    <path d="m15 18-6-6 6-6" />
  </svg>
);

export const ChevronRightIcon = ({ className }: IconProps) => (
  <svg {...iconProps(className)}>
    <path d="m9 18 6-6-6-6" />
  </svg>
);

export const DownloadIcon = ({ className }: IconProps) => (
  <svg {...iconProps(className)}>
    <path d="M12 3v12" />
    <path d="m7 10 5 5 5-5" />
    <path d="M5 21h14" />
  </svg>
);

export const UploadIcon = ({ className }: IconProps) => (
  <svg {...iconProps(className)}>
    <path d="M12 21V9" />
    <path d="m7 14 5-5 5 5" />
    <path d="M5 3h14" />
  </svg>
);

export const PaperclipIcon = ({ className }: IconProps) => (
  <svg {...iconProps(className)}>
    <path d="m21.4 11.6-8.9 8.9a6 6 0 0 1-8.5-8.5l9.6-9.6a4 4 0 0 1 5.7 5.7l-9.7 9.6a2 2 0 0 1-2.8-2.8l8.9-8.9" />
  </svg>
);

export const ImageIcon = ({ className }: IconProps) => (
  <svg {...iconProps(className)}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="8.5" cy="9" r="1.5" />
    <path d="m21 15-5-5L5 20" />
  </svg>
);

export const MoonIcon = ({ className }: IconProps) => (
  <svg {...iconProps(className)}>
    <path d="M20.5 14.5A8 8 0 0 1 9.5 3.5 8.5 8.5 0 1 0 20.5 14.5Z" />
  </svg>
);

export const SunIcon = ({ className }: IconProps) => (
  <svg {...iconProps(className)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

export const ExternalLinkIcon = ({ className }: IconProps) => (
  <svg {...iconProps(className)}>
    <path d="M14 3h7v7M10 14 21 3" />
    <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
  </svg>
);
