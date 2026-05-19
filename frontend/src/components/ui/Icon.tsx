// Icono Feather genérico: recibe los `paths` (atributo d) y los pinta
// con el estilo stroke-based estándar del sistema.

interface IconProps {
  paths: string[];
  size?: number;
  className?: string;
}

export default function Icon({ paths, size = 18, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}
