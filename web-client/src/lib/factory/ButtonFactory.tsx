import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonConfig {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

type FactoryButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

const ButtonVariantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-green-600 text-white hover:bg-green-700',
  secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  success: 'bg-green-500 text-white hover:bg-green-600',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100',
};

const ButtonSizeStyles: Record<ButtonSize, string> = {
  small: 'px-3 py-1 text-sm',
  medium: 'px-4 py-2 text-base',
  large: 'px-6 py-3 text-lg',
};

export class ButtonFactory {
  static createButton(config: ButtonConfig): React.FC<FactoryButtonProps> {
    const {
      variant = 'primary',
      size = 'medium',
      disabled = false,
      loading = false,
      children,
      onClick,
      className = '',
    } = config;

    const variantClass = ButtonVariantStyles[variant];
    const sizeClass = ButtonSizeStyles[size];
    const baseClass = 'font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
    const combinedClass = `${baseClass} ${variantClass} ${sizeClass} ${className}`;

    const ButtonComponent: React.FC<FactoryButtonProps> = (props) => (
        <button
          {...props}
          className={combinedClass}
          disabled={disabled || loading}
          onClick={onClick}
        >
          {loading ? '⏳ ' : ''}{children}
        </button>
      );

    ButtonComponent.displayName = 'FactoryButton';
    return ButtonComponent;
  }

  static createIconButton(config: ButtonConfig & { icon: React.ReactNode }): React.FC<FactoryButtonProps> {
    const { icon, children, ...rest } = config;
    const ButtonComponent = this.createButton({
      ...rest,
      children: (
        <>
          {icon} {children}
        </>
      ),
    });

    ButtonComponent.displayName = 'FactoryIconButton';
    return ButtonComponent;
  }
}
