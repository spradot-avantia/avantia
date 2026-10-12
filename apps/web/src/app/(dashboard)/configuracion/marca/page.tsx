import { redirect } from "next/navigation";

// La marca vive ahora en /mi-academia.
export default function MarcaPage() {
  redirect("/mi-academia");
}
