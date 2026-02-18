import { DefaultTheme } from './themes/default-theme';
import { ModernTheme } from './themes/modern-theme';
import { PrestigeTheme } from './themes/prestige-theme';
import { getUnionPageData } from './get-union-page-data';

export async function UnionPageContent({ slug }: { slug: string }) {
  const data = await getUnionPageData(slug);

  const themeProps = {
    union: data.union,
    posts: data.unionPosts,
    files: data.unionFiles,
    events: data.unionEvents,
    membership: data.membership,
    isOwner: data.isOwner,
    isOwnerOrAdmin: data.isOwnerOrAdmin,
    isApprovedMember: data.isApprovedMember,
    userId: data.currentUser?.id || null,
    slug: data.slug,
    pendingMembersCount: data.pendingMembersCount,
    grievanceNotificationCount: data.grievanceNotificationCount,
    strikeNotificationCount: data.strikeNotificationCount,
    handleSignOut: data.handleSignOut,
    activeAnnouncements: data.activeAnnouncements,
    accessibilityWidgetEnabled: data.union.accessibilityWidgetEnabled ?? true,
    navigationItems: data.navigationItems,
  };

  const ThemeComponent = (() => {
    switch (data.theme) {
      case 'modern':
        return <ModernTheme {...themeProps} />;
      case 'prestige':
        return <PrestigeTheme {...themeProps} />;
      case 'default':
      default:
        return <DefaultTheme {...themeProps} />;
    }
  })();

  return ThemeComponent;
}
