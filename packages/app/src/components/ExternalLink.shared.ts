/**
 * Shared contract for the platform-split external link: an anchor that opens
 * a new tab on web, a pressable Text that hands the URL to the OS on native.
 */
export interface ExternalLinkProps {
  readonly href: string
  readonly children: string
}
