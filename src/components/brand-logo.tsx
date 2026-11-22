import Image from 'next/image';
import logo from '../../The_Connect_Pharma-removebg-LOGO.png';

type BrandLogoProps = {
  size?: 'small' | 'medium' | 'large';
};

const sizeClasses = {
  small: 'w-[120px]',
  medium: 'w-[140px]',
  large: 'w-[190px]'
} as const;

export function BrandLogo({ size = 'medium' }: BrandLogoProps) {
  return (
    <Image
      src={logo}
      alt="The Connect Pharma — Compare, Connect, Grow"
      className={`${sizeClasses[size]} h-auto`}
      priority
    />
  );
}
