'use client'

import '@tamagui/core/reset.css'
import { useServerInsertedHTML } from 'next/navigation'
import React from 'react'
import { TamaguiProvider as TamaguiProviderCore } from 'tamagui'
import tamaguiConfig from '../../tamagui.config'

export function TamaguiProvider({ children }: { children: React.ReactNode }) {
  useServerInsertedHTML(() => {
    const styles = tamaguiConfig.getNewCSS()

    if (styles !== undefined && styles !== '') {
      return (
        <style
          dangerouslySetInnerHTML={{ __html: styles }}
          id="tamagui-ssr"
        />
      )
    }

    return null
  })

  return (
    <TamaguiProviderCore config={tamaguiConfig} disableRootThemeClass>
      {children}
    </TamaguiProviderCore>
  )
}
