import { Package } from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  navGroups: [
    {
      title: 'Publisher',
      items: [
        {
          title: 'My Apps',
          url: '/',
          icon: Package,
        },
      ],
    },
  ],
}
