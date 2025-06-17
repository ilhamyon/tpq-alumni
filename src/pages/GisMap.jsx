import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { sanityClient } from "../lib/sanity/getClient";
import iconBerugak from "/icon-berugak.png"

const GISMap = () => {
  const [data, setData] = useState([]);
  const [geoData, setGeoData] = useState({
    provinces: [],
    regencies: [],
    districts: [],
    villages: [],
  });
  const mapRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const query =
          '*[_type == "tpq-entry"]{_id, nama, date, province, regency, district, village, tahunLulus, telepon, jumlahMurid, fotoEksternal, "foto": foto.asset->url, geometry, user-> {name}}';
        const result = await sanityClient.fetch(query);
        setData(result);

        // Ambil daftar ID unik untuk setiap wilayah
        const provinceIds = [...new Set(result.map((item) => item.province))];
        const regencyIds = [...new Set(result.map((item) => item.regency))];
        const districtIds = [...new Set(result.map((item) => item.district))];
        // eslint-disable-next-line no-unused-vars
        const villageIds = [...new Set(result.map((item) => item.village))];

        // Fetch data wilayah dari API
        const [provinces, regencies, districts, villages] = await Promise.all([
          fetch("https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json").then((res) => res.json()),
          Promise.all(provinceIds.map((id) => fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${id}.json`).then((res) => res.json()))).then((data) => data.flat()),
          Promise.all(regencyIds.map((id) => fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${id}.json`).then((res) => res.json()))).then((data) => data.flat()),
          Promise.all(districtIds.map((id) => fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${id}.json`).then((res) => res.json()))).then((data) => data.flat()),
        ]);

        setGeoData({ provinces, regencies, districts, villages });
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  // Fungsi untuk mencari nama wilayah berdasarkan ID
  const getNameById = (id, list) => {
    if (!list) return "Not Found";
    const item = list.find((item) => String(item.id) === String(id));
    return item ? item.name : "Not Found";
  };

  useEffect(() => {
    const handleResize = () => {
      mapRef.current?.invalidateSize();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);  

  return (
    <>
    {/* Navbar */}
    <div className="sticky top-0 w-full right-0 lg:px-10 px-4 py-2 cursor-pointer bg-white shadow z-[1000]">
        <div className="flex justify-between items-center">
            <div className="flex justify-center gap-4 items-center">
                <img className="rounded-full h-14" src="https://tkidarulmuhajirin.wordpress.com/wp-content/uploads/2020/02/cropped-logo-dm.png" />
                <h3 className="text-gray-800 lg:text-xl font-semibold">TPQ Alumni Ponpes Darul Muhajirin</h3>
            </div>
        </div>
    </div>
    <MapContainer
      center={[-8.686231, 116.106701]}
      zoom={13}
      style={{ height: "calc(100vh - 64px)", width: "100%" }}
      ref={mapRef}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      <FitBounds data={data} />
      {data.map((item) => (
        <Marker
          key={item._id}
          position={[item.geometry?.lat || 0, item.geometry?.lng || 0]}
          icon={L.icon({
            iconUrl: iconBerugak,
            iconSize: [30, 30],
            iconAnchor: [12, 41],
          })}
        >
          <Popup>
            <div className="flex flex-col gap-2">
              <div><strong>Nama:</strong> {item?.nama || "N/A"}</div>
              <div><strong>Tahun Lulus:</strong> {item?.tahunLulus || ""}</div>
              <div>
                <strong>Alamat: </strong>
                {[
                  item.alamat,
                  getNameById(item.village, geoData.villages),
                  getNameById(item.district, geoData.districts),
                  getNameById(item.regency, geoData.regencies),
                ]
                  .filter(Boolean)
                  .join(", ")}
              </div>
              {/* <p><strong>Rekomendasi:</strong> {item?.rekomendasi}</p> */}
              <div><strong>Telepon:</strong> {item?.telepon}</div>
              <div><strong>Jumlah Murid TPQ:</strong> {item?.jumlahMurid}</div>
              {item?.fotoEksternal && (
                <img
                  src={item?.fotoEksternal}
                  alt="Foto Kegiatan"
                  style={{ width: "100%", height: "auto" }}
                />
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
    </>
  );
};

// Komponen untuk otomatis menyesuaikan tampilan peta dengan data yang tersedia
// eslint-disable-next-line react/prop-types
const FitBounds = ({ data }) => {
  const map = useMap();

  useEffect(() => {
    // eslint-disable-next-line react/prop-types
    if (data.length > 0) {
      // eslint-disable-next-line react/prop-types
      const bounds = L.latLngBounds(data.map((item) => [item.geometry?.lat || 0, item.geometry?.lng || 0]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [data, map]);

  return null;
};

export default GISMap;
