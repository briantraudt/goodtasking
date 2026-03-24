import { Check } from 'lucide-react';

interface BrandMarkProps {
  className?: string;
  iconClassName?: string;
}

const BrandMark = ({ className = '', iconClassName = '' }: BrandMarkProps) => {
  return (
    <div className={`flex items-center justify-center rounded-lg bg-primary ${className}`.trim()}>
      <Check className={`text-white ${iconClassName}`.trim()} strokeWidth={3} />
    </div>
  );
};

export default BrandMark;
