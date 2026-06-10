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
