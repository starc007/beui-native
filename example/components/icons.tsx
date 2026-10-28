// Hugeicons, imported one file per icon so the bundle holds only these and
// not the whole free set (Metro does not tree-shake).
import AiBrain01 from "@hugeicons/core-free-icons/AiBrain01Icon";
import ArrowRight02 from "@hugeicons/core-free-icons/ArrowRight02Icon";
import ArrowUp02 from "@hugeicons/core-free-icons/ArrowUp02Icon";
import Attachment01 from "@hugeicons/core-free-icons/Attachment01Icon";
import Bookmark02 from "@hugeicons/core-free-icons/Bookmark02Icon";
import Calendar03 from "@hugeicons/core-free-icons/Calendar03Icon";
import Cancel01 from "@hugeicons/core-free-icons/Cancel01Icon";
import Clock01 from "@hugeicons/core-free-icons/Clock01Icon";
import Delete02 from "@hugeicons/core-free-icons/Delete02Icon";
import Edit02 from "@hugeicons/core-free-icons/Edit02Icon";
import FaceId from "@hugeicons/core-free-icons/FaceIdIcon";
import Favourite from "@hugeicons/core-free-icons/FavouriteIcon";
import File01 from "@hugeicons/core-free-icons/File01Icon";
import Flag02 from "@hugeicons/core-free-icons/Flag02Icon";
import Flash from "@hugeicons/core-free-icons/FlashIcon";
import Folder01 from "@hugeicons/core-free-icons/Folder01Icon";
import Image01 from "@hugeicons/core-free-icons/Image01Icon";
import LockKey from "@hugeicons/core-free-icons/LockKeyIcon";
import Mail01 from "@hugeicons/core-free-icons/Mail01Icon";
import Megaphone01 from "@hugeicons/core-free-icons/Megaphone01Icon";
import MoreHorizontal from "@hugeicons/core-free-icons/MoreHorizontalIcon";
import Note01 from "@hugeicons/core-free-icons/Note01Icon";
import Notification01 from "@hugeicons/core-free-icons/Notification01Icon";
import Package from "@hugeicons/core-free-icons/PackageIcon";
import Pin from "@hugeicons/core-free-icons/PinIcon";
import PlusSign from "@hugeicons/core-free-icons/PlusSignIcon";
import Search01 from "@hugeicons/core-free-icons/Search01Icon";
import SecurityCheck from "@hugeicons/core-free-icons/SecurityCheckIcon";
import Share08 from "@hugeicons/core-free-icons/Share08Icon";
import Sparkles from "@hugeicons/core-free-icons/SparklesIcon";
import TextFont from "@hugeicons/core-free-icons/TextFontIcon";
import TextIcon02 from "@hugeicons/core-free-icons/TextIcon";
import Tick02 from "@hugeicons/core-free-icons/Tick02Icon";
import Unavailable from "@hugeicons/core-free-icons/UnavailableIcon";
import User from "@hugeicons/core-free-icons/UserIcon";
import View from "@hugeicons/core-free-icons/ViewIcon";
import ViewOffSlash from "@hugeicons/core-free-icons/ViewOffSlashIcon";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react-native";
import type { IconProps } from "../../src";

/**
 * Adapts a Hugeicon to beUI's icon contract: a component given `{ size, color }`.
 * Created once per icon at module scope, so each keeps a stable identity.
 */
function hugeicon(icon: IconSvgElement) {
  return function Icon({ size, color }: IconProps) {
    return (
      <HugeiconsIcon icon={icon} size={size} color={color} strokeWidth={1.8} />
    );
  };
}

export const PlusIcon = hugeicon(PlusSign);
export const ArrowRightIcon = hugeicon(ArrowRight02);
export const HeartIcon = hugeicon(Favourite);
export const MailIcon = hugeicon(Mail01);
export const SearchIcon = hugeicon(Search01);
export const EyeIcon = hugeicon(View);
export const EyeOffIcon = hugeicon(ViewOffSlash);
export const CheckIcon = hugeicon(Tick02);
export const PinIcon = hugeicon(Pin);
export const ClockIcon = hugeicon(Clock01);
export const TrashIcon = hugeicon(Delete02);
export const FileIcon = hugeicon(File01);
export const UserIcon = hugeicon(User);
export const FlagIcon = hugeicon(Flag02);
export const ShieldIcon = hugeicon(SecurityCheck);
export const MegaphoneIcon = hugeicon(Megaphone01);
export const CalendarIcon = hugeicon(Calendar03);
export const PackageIcon = hugeicon(Package);
export const FolderIcon = hugeicon(Folder01);
export const CloseIcon = hugeicon(Cancel01);
export const BellIcon = hugeicon(Notification01);
export const BookmarkIcon = hugeicon(Bookmark02);
export const ShareIcon = hugeicon(Share08);
export const BrainIcon = hugeicon(AiBrain01);
export const AttachIcon = hugeicon(Attachment01);
export const FlashIcon = hugeicon(Flash);
export const ImageIcon = hugeicon(Image01);
export const SparklesIcon = hugeicon(Sparkles);
export const ArrowUpIcon = hugeicon(ArrowUp02);
export const EditIcon = hugeicon(Edit02);
export const MoreIcon = hugeicon(MoreHorizontal);
export const FontIcon = hugeicon(TextFont);
export const TextSizeIcon = hugeicon(TextIcon02);
export const FaceIdIcon = hugeicon(FaceId);
export const LockIcon = hugeicon(LockKey);
export const NoteIcon = hugeicon(Note01);
export const BlockIcon = hugeicon(Unavailable);
