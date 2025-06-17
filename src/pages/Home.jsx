import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { deauthUser, isAuthenticated } from "../utils/auth";
import { Button, DatePicker, Dropdown, Form, Input, Menu, message, Select } from "antd";
// import imageIqbalIndahCenter from "../assets/rohmi.jpg"
// import { sanityClient } from "../lib/sanity/getClient";
// import { InboxOutlined } from '@ant-design/icons';
import axios from "axios";

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'antd/dist/reset.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Memperbaiki ikon marker
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// eslint-disable-next-line react/prop-types
const UpdateMapCenter = ({ position }) => {
  const map = useMap();

  useEffect(() => {
    map.flyTo(position, map.getZoom());
  }, [position, map]);

  return null;
};

const { Option } = Select;

function Home() {
  const navigate = useNavigate();
  const tpq_userData = JSON.parse(localStorage.getItem('tpq_userData'));
  const tpq_id = (localStorage.getItem('tpq_id'));
  console.log('cek user: ', tpq_userData)

  useEffect(() => {
    // Check if the user is authenticated when the component mounts
    if (!isAuthenticated()) {
      // If not authenticated, redirect to the sign-in page
      message.error("Kamu belum login. Silahkan login terlebir dahulu!");
      navigate("/login");
    }
  }, [navigate]);

  const [loading, setLoading] = useState(false);
  const [geometry, setGeometry] = useState({ lng: '', lat: '' });
  // const [namaLokasi, setNamaLokasi] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'h36o5eck'); // Ganti dengan upload preset Anda

    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/dnuyb460n/image/upload`, // Ganti dengan cloud name Anda
        formData
      );

      if (response.status === 200) {
        setImageUrl(response.data.secure_url);
        message.success('Gambar berhasil diunggah');
      } else {
        message.error('Gagal mengunggah gambar');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      message.error('Gagal mengunggah gambar');
    } finally {
      // setLoading(false);
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Kirim data ke Sanity
      await fetch(`https://ln9ujpru.api.sanity.io/v2021-03-25/data/mutate/production`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer skAdQo8vEzaH81Ah4n2X8QDNsgIfdWkJlLmbo3CbT6Nt3nW7iTLx2roYCOm9Rlp1mQV2nEEGCqf4aGSMaJx67iK5PZPe7CgmI9Lx9diRdq0ssoRzl1LhiUFXHQmKu0utxgBa1ttoKwat3KIFt2B5vskrT82ekR5B8sbSzE51VjZHy3T7Q62P`,
        },
        body: JSON.stringify({
          mutations: [
            {
              create: {
                _type: 'tpq-entry',
                nama: values.nama,
                date: values.date,
                province: values.province,
                regency: values.regency,
                district: values.district,
                village: values.village,
                tahunLulus: values.tahunLulus,
                telepon: values.telepon,
                jumlahMurid: values.jumlahMurid,
                fotoEksternal: imageUrl,
                geometry: geometry,
                user: {
                  _type: 'reference',
                  _ref: tpq_id // Ganti dengan ID pengguna jika perlu
                }
              },
            },
          ],
        }),
      });

      message.success('Data kegiatan berhasil ditambahkan!');
      setLoading(false);
      // window.location.reload();
    } catch (error) {
      console.error('Error adding data:', error);
      message.error('Gagal menambahkan data pemasangan');
      setLoading(false);
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo);
  };

  // const [alamat, setAlamat] = useState('');
  // // const [kordinat, setKordinat] = useState('');

  // const handleAlamatChange = (e) => {
  //   setAlamat(e.target.value);
  // };

  const [position, setPosition] = useState({ lat: -8.692290, lng: 116.183420 });
  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setPosition({ lat: latitude, lng: longitude });
          setGeometry({ lat: latitude, lng: longitude });
          message.success('Berhasil menyimpan titik lokasi');
        },
        (error) => {
          console.error('Error getting current location:', error);
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  const [selectedProvince, setSelectedProvince] = useState("52"); // Default ke 52
  const [selectedRegency, setSelectedRegency] = useState(null); // Default ke 5202
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [provinces, setProvinces] = useState([]);
  const [villages, setVillages] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [regencies, setRegencies] = useState([]);
  const [districts, setDistricts] = useState([]);

  // Fetch regencies saat komponen dimuat
  useEffect(() => {
    // Fetch provinces and filter for Nusa Tenggara Barat (ID = 17)
    axios.get('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
      .then(response => {
        const ntbProvince = response.data.find(province => province.id === '52');
        if (ntbProvince) {
          setProvinces([ntbProvince]);
        } else {
          message.error('Provinsi Nusa Tenggara Barat tidak ditemukan.');
        }
      })
      .catch(error => {
        console.error('Error fetching provinces:', error);
        message.error('Gagal memuat provinsi');
      });
  }, []);

  // eslint-disable-next-line no-unused-vars
  const handleProvinceChange = (value) => {
    setSelectedProvince(value);
    setSelectedRegency(null);
    setSelectedDistrict(null);
    setVillages([]);

    // Fetch regencies for the selected province
    axios.get(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${value}.json`)
      .then(response => {
        setRegencies(response.data);
      })
      .catch(error => {
        console.error('Error fetching regencies:', error);
        message.error('Gagal memuat kabupaten/kota');
      });
  };

  // eslint-disable-next-line no-unused-vars
  const handleRegencyChange = (value) => {
    setSelectedRegency(value);
    setSelectedDistrict(null);
    setVillages([]);

    // Fetch districts for the selected regency
    axios.get(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${value}.json`)
      .then(response => {
        setDistricts(response.data);
      })
      .catch(error => {
        console.error('Error fetching districts:', error);
        message.error('Gagal memuat kecamatan');
      });
  };

  const handleDistrictChange = (value) => {
    setSelectedDistrict(value);

    // Fetch villages for the selected district
    axios.get(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${value}.json`)
      .then(response => {
        setVillages(response.data);
      })
      .catch(error => {
        console.error('Error fetching villages:', error);
        message.error('Gagal memuat desa/kelurahan');
      });
  };

  const handleSave = () => {
    setGeometry({ lat: position.lat, lng: position.lng });
    message.success(`Berhasil menyimpan titik lokasi`);
  };

  console.log('cek geometry:', position)

  const gradientStyle = {
    background: 'linear-gradient(to right, rgba(255, 255, 255, 0.95), transparent)',
    position: 'absolute',
    inset: '0'
  };

  const menu = (
    <Menu>
      <Menu.Item key="webgis"><Link to="/">Lihat Web GIS</Link></Menu.Item>
      <Menu.Item key="signout" onClick={deauthUser}>Logout</Menu.Item>
    </Menu>
  );
  return (
    <>
      <div className="w-full right-0 px-10 py-3 bg-white shadow">
        <div className="flex lg:justify-between justify-center items-center">
          <div className="flex justify-center gap-4 items-center">
              <img className="rounded-full h-16" src="https://tkidarulmuhajirin.wordpress.com/wp-content/uploads/2020/02/cropped-logo-dm.png" />
              <h3 className="text-gray-800 lg:text-xl font-semibold">TPQ Alumni Ponpes Darul Muhajirin</h3>
          </div>
          <Dropdown overlay={menu} placement="bottomRight" arrow trigger={['click']} className="lg:flex hidden cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-gray-300 flex justify-center items-center">
              <svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="24" cy="12" r="8" fill="#333" stroke="#333" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/><path d="M42 44C42 34.0589 33.9411 26 24 26C14.0589 26 6 34.0589 6 44" stroke="#333" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </Dropdown>
        </div>
      </div>
      <section id="hero" className="relative bg-[url(https://scontent.fdps5-1.fna.fbcdn.net/v/t39.30808-6/476165562_1146840823736970_894567502908051068_n.jpg?_nc_cat=110&ccb=1-7&_nc_sid=cc71e4&_nc_eui2=AeG4GRZU5FcZyulqlEck5-hJAF_aQvyTmFAAX9pC_JOYUHdpJaqXulNMGhxamj4Y5_TeSsdYpt-SUybMSLLB-Ycv&_nc_ohc=ihyh-To5l_UQ7kNvwFg542N&_nc_oc=AdlMyaTaEgb4F1n_xwqYh4vVJpCC5PjTlBNwoHGtghH9Gfa-QOt_X4E_0KkZheOFi0w&_nc_zt=23&_nc_ht=scontent.fdps5-1.fna&_nc_gid=qHwLs-Y6_7-5CUu5fde-_w&oh=00_AfPMe_QxyxiiNHIXihahG8xYuQjtGH2cslv_YfgXSzGsmg&oe=6856D036)] bg-cover bg-center bg-no-repeat">
        <div style={gradientStyle}></div>

        <div className="relative mx-auto max-w-screen-xl px-4 py-32 sm:px-6 lg:flex lg:h-screen lg:items-center lg:px-8">
          <div className="max-w-4xl text-center sm:text-left">
            {/* <div className="flex justify-center items-center mb-6">
              <img className="rounded-full w-48 h-48" src="https://i0.wp.com/radarmandalika.id/wp-content/uploads/2021/06/F-Lalu-firman-Wijaya.jpeg?w=639&ssl=1" />
            </div> */}
            <h1 className="text-3xl font-extrabold sm:text-5xl text-gray-800">
              GIS TPQ Alumni Ponpes
              <strong className="block font-extrabold text-green-600 mt-2"> Darul Muhajirin </strong>
            </h1>

            <p className="mt-4 max-w-4xl sm:text-xl/relaxed text-gray-700">
              Ini merupakan pendataan untuk mengetahui semua Alumni Ponpes Darul Muhajirin yang mengelola TPQ atau jamaah lainnya.
            </p>

            <div className="mt-8 flex flex-wrap gap-4 text-center">
              <a
                href="#input-lokasi"
                className="flex justify-center items-center w-full rounded bg-green-600 px-12 py-3 text-sm font-medium text-white shadow hover:bg-green-600 focus:outline-none focus:ring active:bg-green-500 sm:w-auto"
              >
                Input Data
              </a>

              <Link
                to="/data-lokasi"
                className="flex py-2 justify-center w-full rounded bg-white px-12 items-center text-sm shadow focus:outline-none focus:ring active:text-green-500 sm:w-auto"
              >
                <Button className="border-0 font-medium text-green-600 hover:text-green-600">
                  Data Sebaran
                </Button>
              </Link>

              <a
                onClick={deauthUser}
                className="flex lg:hidden justify-center items-center w-full rounded bg-green-600 px-12 py-3 text-sm font-medium text-white shadow hover:bg-green-600 focus:outline-none focus:ring active:bg-rose-500 sm:w-auto"
              >
                Logout
              </a>
            </div>
          </div>
        </div>
      </section>
      
      <section id="input-lokasi" className="text-gray-600 py-10 lg:px-36 mb-10">
        <div className="lg:px-60 px-4">
          <Form
            name="addDataForm"
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            layout="vertical"
            size="large"
          >
            {/* <Form.Item
              label="Jenis Usaha"
              name="jenisUsaha"
              rules={[{ required: true, message: 'Jenis Usaha harus diisi' }]}
            >
              <Select
                className="w-full"
                // onChange={handleChange}
                placeholder="Pilih jenis usaha"
                options={[
                  {
                    value: 'Tanam Jagung',
                    label: 'Tanam Jagung',
                  },
                  {
                    value: 'Tambak Udang',
                    label: 'Tambak Udang',
                  },
                  {
                    value: 'Pembuat Garam',
                    label: 'Pembuat Garam',
                  },
                  {
                    value: 'Tanam Tembakau',
                    label: 'Tanam Tembakau',
                  },
                ]}
              />
            </Form.Item> */}

            <Form.Item
              label="Nama"
              name="nama"
              rules={[{ required: true, message: 'Nama harus diisi' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Tahun Lulus"
              name="tahunLulus"
              rules={[{ required: true, message: 'Tahun Lulus harus diisi' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Waktu"
              name="date"
              rules={[{ required: true, message: 'Waktu harus diisi' }]}
            >
              <DatePicker className="w-full" />
            </Form.Item>

            <Form.Item
              label="Provinsi"
              name="province"
              rules={[{ required: true, message: 'Provinsi harus dipilih' }]}
            >
              <Select onChange={handleProvinceChange} placeholder="Pilih Provinsi">
                {provinces.map(province => (
                  <Option key={province.id} value={province.id}>
                    {province.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Kabupaten/Kota"
              name="regency"
              rules={[{ required: true, message: 'Kabupaten/Kota harus dipilih' }]}
            >
              <Select
                onChange={handleRegencyChange}
                placeholder="Pilih Kabupaten/Kota"
                disabled={!selectedProvince}
              >
                {regencies.map(regency => (
                  <Option key={regency.id} value={regency.id}>
                    {regency.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Kecamatan"
              name="district"
              rules={[{ required: true, message: 'Kecamatan harus dipilih' }]}
            >
              <Select
                onChange={handleDistrictChange}
                placeholder="Pilih Kecamatan"
                disabled={!selectedRegency}
              >
                {districts.map(district => (
                  <Option key={district.id} value={district.id}>
                    {district.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Desa/Kelurahan"
              name="village"
              rules={[{ required: true, message: 'Desa/Kelurahan harus dipilih' }]}
            >
              <Select
                placeholder="Pilih Desa/Kelurahan"
                disabled={!selectedDistrict}
              >
                {villages.map(village => (
                  <Option key={village.id} value={village.id}>
                    {village.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Input Kordinat (Klik Gunakan Lokasi Saat Ini atau Anda Juga Bisa Menentukan Titik Sendiri di Map)"
              name="position"
            >
              <div className="mb-4">
                <Button className="bg-green-600 text-white" onClick={handleUseCurrentLocation}>Gunakan Lokasi Saat Ini</Button>
              </div>
              <div>
                <MapContainer center={position} zoom={13} style={{ height: '60vh', width: '100%' }}>
                  <UpdateMapCenter position={position} />
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <Marker
                    position={position}
                    draggable={true}
                    eventHandlers={{
                      dragend(event) {
                        setPosition(event.target.getLatLng());
                      },
                    }}
                  >
                    <Popup>
                      <div>
                        <p>Latitude: {position.lat.toFixed(4)}</p>
                        <p>Longitude: {position.lng.toFixed(4)}</p>
                        <Button className="bg-green-600 text-white" onClick={handleSave}>Simpan Titik</Button>
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
            </Form.Item>
            <div className="text-gray-400 text-xs -mt-4 mb-6">
              {position.lat && position.lng && (
                <p>({position.lat}, {position.lng})</p>
              )}
              {/* <p>{geometry}</p> */}
            </div>

            {/* <Form.Item
              label="Lokasi Spesifik"
              name="lokasiSpesifik"
              rules={[{ required: true, message: 'Lokasi Spesifik harus diisi' }]}
            >
              <Select
                className="w-full"
                // onChange={handleChange}
                placeholder="Pilih lokasi spesifik"
                options={[
                  {
                    value: 'Masjid',
                    label: 'Masjid',
                  },
                  {
                    value: 'Mushalla',
                    label: 'Mushalla',
                  },
                  {
                    value: 'Pesantren',
                    label: 'Pesantren',
                  },
                  {
                    value: 'Rumah Warga',
                    label: 'Rumah Warga',
                  },
                  {
                    value: 'Lainnya',
                    label: 'Lainnya',
                  },
                ]}
              />
            </Form.Item> */}

            <Form.Item
              label="Telepon"
              name="telepon"
              rules={[{ required: true, message: 'Telepon harus diisi' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Jumlah Murid TPQ"
              name="jumlahMurid"
              rules={[{ required: true, message: 'Jumlah Murid TPQ harus diisi' }]}
            >
              <Input />
            </Form.Item>

            {/* <Form.Item
              label="Bentuk Bantuan (Jika ada)"
              name="bentukBantuan"
              rules={[{ required: false }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Jumlah Peserta"
              name="jumlahPeserta"
              rules={[{ required: true, message: 'Jumlah Peserta harus diisi' }]}
            >
              <div className="flex gap-2">
                <Input />
              </div>
            </Form.Item> */}

            <Form.Item
              label="Foto"
              name="foto"
              rules={[{ required: true, message: 'Foto harus diunggah' }]}
            >
              <input type="file" accept="image/*" onChange={handleFileChange} />
            </Form.Item>

            <Form.Item
              label="Longitude"
              name="lng"
              initialValue={geometry.lng}
              hidden
            >
              <Input disabled />
            </Form.Item>

            <Form.Item
              label="Latitude"
              name="lat"
              initialValue={geometry.lat}
              hidden
            >
              <Input disabled />
            </Form.Item>

            <Form.Item>
              <Button className="bg-green-600 text-white" htmlType="submit" loading={loading} disabled={!imageUrl || !geometry}>
                Submit
              </Button>
            </Form.Item>
          </Form>
        </div>
      </section>
    </>
  )
}

export default Home