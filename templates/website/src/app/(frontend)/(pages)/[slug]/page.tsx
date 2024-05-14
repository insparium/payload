import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { draftMode, headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'

import type { Page } from '../../../../payload-types'

import { Blocks } from '../../../_components/Blocks'
import { Hero } from '../../../_components/Hero'
import { PayloadRedirects } from '../../../_components/PayloadRedirects'
import { generateMeta } from '../../../_utilities/generateMeta'

const queryPageBySlug = async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = draftMode()

  const payload = await getPayload({ config: configPromise })
  const user = draft ? await payload.auth({ headers: headers() }) : undefined

  const result = await payload.find({
    collection: 'pages',
    draft,
    limit: 1,
    overrideAccess: false,
    user,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return result.docs?.[0] || null
}

export default async function Page({ params: { slug = '' } }) {
  const url = '/' + slug

  const page = await queryPageBySlug({
    slug,
  })

  if (!page) {
    return notFound()
  }

  const { hero, layout } = page

  return (
    <React.Fragment>
      <PayloadRedirects url={url} />
      <Hero {...hero} />
      <Blocks
        blocks={layout}
        disableTopPadding={!hero || hero?.type === 'none' || hero?.type === 'lowImpact'}
      />
    </React.Fragment>
  )
}

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const pages = await payload.find({
    collection: 'pages',
    draft: false,
    limit: 1000,
    overrideAccess: false,
  })

  return pages.docs?.map(({ slug }) => slug)
}

export async function generateMetadata({ params: { slug = '' } }): Promise<Metadata> {
  const page = await queryPageBySlug({
    slug,
  })

  return generateMeta({ doc: page })
}