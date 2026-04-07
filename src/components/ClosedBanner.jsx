import content from '../data/content.json';

const { storeStatus } = content;

export default function ClosedBanner() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gray-900 text-white text-center py-3 px-4 font-bold text-sm shadow-lg">
      {storeStatus.closedBanner}
    </div>
  );
}
