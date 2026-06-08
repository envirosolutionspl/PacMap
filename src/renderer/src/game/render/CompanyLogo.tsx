import companyLogoPngUrl from '../../assets/logo.png'
import stageLogoPngUrl from '../../assets/logo_pacman_nobg.png'

type CompanyLogoVariant = 'menu' | 'stage'

interface CompanyLogoProps {
  readonly variant: CompanyLogoVariant
}

export function CompanyLogo({ variant }: CompanyLogoProps): React.JSX.Element {
  const logoUrl = variant === 'menu' ? companyLogoPngUrl : stageLogoPngUrl

  return (
    <div className={`company-logo company-logo-${variant}`} aria-label="Company logo" role="img">
      <img
        className="company-logo-mark"
        src={logoUrl}
        alt=""
        draggable="false"
        aria-hidden="true"
      />
    </div>
  )
}
