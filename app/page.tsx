import CRMProvider from "@/components/crm-provider";
import CRMApp from "@/components/crm-app";
export default function Page() {
  return (
    <CRMProvider>
      <CRMApp />
    </CRMProvider>
  );
}
