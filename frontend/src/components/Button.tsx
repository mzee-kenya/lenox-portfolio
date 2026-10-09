import type { ComponentType, ReactNode } from "react";

export type ButtonKind = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps {
  kind?: ButtonKind;
  size?: "md" | "sm";
  icon?: ComponentType<{ size?: number }>;
  href?: string;
  download?: string;
  target?: string;
  rel?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  block?: boolean;
  children: ReactNode;
  "aria-label"?: string;
}

export function Button({
  kind = "primary",
  size = "md",
  icon: Icon,
  href,
  download,
  target,
  rel,
  onClick,
  type = "button",
  disabled,
  block,
  children,
  ...rest
}: ButtonProps) {
  const classes = [
    "btn",
    `btn--${kind}`,
    size === "sm" ? "btn--sm" : "",
    block ? "btn--block" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const inner = (
    <>
      {Icon ? <Icon size={size === "sm" ? 15 : 17} /> : null}
      <span>{children}</span>
    </>
  );

  if (href) {
    return (
      <a
        className={classes}
        href={href}
        download={download}
        target={target}
        rel={target === "_blank" ? "noreferrer noopener" : rel}
        aria-disabled={disabled}
        {...rest}
      >
        {inner}
      </a>
    );
  }

  return (
    <button className={classes} type={type} onClick={onClick} disabled={disabled} {...rest}>
      {inner}
    </button>
  );
}