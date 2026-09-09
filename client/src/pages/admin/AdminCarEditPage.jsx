import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api';
import { AdminLayout } from '../../components/AdminLayout';
import { Icon } from '../../components/Icon';
import { vehicleImageUrl } from '../../utils/format';

const empty = {
  id: '', name: '', trim: '', basePrice: '', extraPrice: '', seats: 5, fuel: '', gear: '', km: '', color: '', active: true, imageUrl: '',
};

export default function AdminCarEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imageError, setImageError] = useState('');
  const [imageSuccess, setImageSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  useEffect(() => {
    api.adminMe().catch(() => navigate('/admin'));
    if (!isNew) {
      api.adminVehicles().then((d) => {
        const v = d.vehicles.find((x) => x.id === id);
        if (v) {
          setForm({
            id: v.id, name: v.name, trim: v.trim, basePrice: v.base_price, extraPrice: v.extra_price,
            seats: v.seats, fuel: v.fuel, gear: v.gear, km: v.km, color: v.color, active: !!v.active,
            imageUrl: v.image_url || '',
          });
        }
      });
    }
  }, [id, isNew, navigate]);

  const save = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (isNew) {
        const data = await api.adminCreateVehicle(form);
        navigate(`/admin/cars/${data.vehicle.id}`);
      } else {
        const { imageUrl: _img, ...payload } = form;
        await api.adminUpdateVehicle(id, payload);
        setSuccess('تغییرات ذخیره شد.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file || isNew) return;
    setImageUploading(true);
    setImageError('');
    setImageSuccess('');
    setError('');
    setSuccess('');
    try {
      const data = await api.adminUploadVehicleImage(id, file);
      setForm((f) => ({ ...f, imageUrl: data.vehicle.image_url }));
      setImageSuccess('تصویر با موفقیت بارگذاری شد.');
    } catch (err) {
      setImageError(err.message || 'بارگذاری تصویر ناموفق بود.');
    } finally {
      setImageUploading(false);
      e.target.value = '';
    }
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const preview = vehicleImageUrl(form.imageUrl);

  return (
    <AdminLayout active="cars">
      <div className="row between mb-16">
        <h2 className="section-title mt-0">{isNew ? 'خودرو جدید' : 'ویرایش خودرو'}</h2>
        <Link to="/admin/cars" className="btn btn-ghost btn-sm">بازگشت به لیست</Link>
      </div>

      <div className="admin-edit-layout">
        <div className="stack" style={{ '--gap': '16px' }}>
          <form className="card card-pad" onSubmit={save}>
            <h3 style={{ fontSize: 16, marginBottom: 16 }}>اطلاعات پایه</h3>
            {error && <div className="alert alert-danger mb-16">{error}</div>}
            {success && <div className="alert alert-success mb-16">{success}</div>}
            <div className="field mb-16"><label className="label">شناسه</label><input className="input" disabled={!isNew} value={form.id} onChange={(e) => set('id', e.target.value)} required /></div>
            <div className="field mb-16"><label className="label">نام/مدل</label><input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} required /></div>
            <div className="field mb-16"><label className="label">تریم</label><input className="input" value={form.trim} onChange={(e) => set('trim', e.target.value)} /></div>
            <div className="form-grid">
              <div className="field"><label className="label">گیربکس</label><input className="input" value={form.gear} onChange={(e) => set('gear', e.target.value)} /></div>
              <div className="field"><label className="label">سوخت</label><input className="input" value={form.fuel} onChange={(e) => set('fuel', e.target.value)} /></div>
              <div className="field"><label className="label">صندلی</label><input className="input" type="number" value={form.seats} onChange={(e) => set('seats', e.target.value)} /></div>
              <div className="field"><label className="label">رنگ</label><input className="input" value={form.color} onChange={(e) => set('color', e.target.value)} /></div>
            </div>
            <div className="form-grid mt-16">
              <div className="field"><label className="label">قیمت پایه (۱۲ساعت)</label><input className="input" type="number" value={form.basePrice} onChange={(e) => set('basePrice', e.target.value)} required /></div>
              <div className="field"><label className="label">مبلغ هر ۱۲ ساعت بعدی</label><input className="input" type="number" value={form.extraPrice} onChange={(e) => set('extraPrice', e.target.value)} required /></div>
            </div>
            <label className="row gap-sm mt-16"><input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} /> فعال در خودروها</label>
            <button type="submit" className={`btn btn-primary btn-block mt-24 ${loading ? 'loading' : ''}`}>
              {isNew ? 'ذخیره و ادامه' : 'ذخیره تغییرات'}
            </button>
          </form>

          <div className="card card-pad">
            <h3 style={{ fontSize: 16, marginBottom: 16 }}>تصاویر</h3>
            {imageError && <div className="alert alert-danger mb-16">{imageError}</div>}
            {imageSuccess && <div className="alert alert-success mb-16">{imageSuccess}</div>}
            {isNew ? (
              <p className="muted small">ابتدا خودرو را ذخیره کنید، سپس می‌توانید تصویر بارگذاری کنید.</p>
            ) : (
              <div className="row gap-sm wrap">
                <div style={{
                  width: 120, height: 90, borderRadius: 10, overflow: 'hidden',
                  background: 'linear-gradient(135deg,#eef2f7,#dde5ef)',
                  display: 'grid', placeItems: 'center', color: 'var(--muted-2)',
                }}>
                  {preview ? (
                    <img src={preview} alt={form.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Icon name="car" />
                  )}
                </div>
                <label className={`dropzone ${imageUploading ? 'loading' : ''}`} style={{ width: 160, minHeight: 90, padding: '12px 8px', display: 'grid', placeItems: 'center', cursor: imageUploading ? 'wait' : 'pointer' }}>
                  <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp,image/*" hidden onChange={uploadImage} disabled={imageUploading} />
                  <Icon name="upload" />
                  <span className="small strong mt-8">{imageUploading ? 'در حال بارگذاری…' : 'انتخاب تصویر'}</span>
                </label>
              </div>
            )}
            <p className="hint mt-8">JPG/PNG/WebP تا ۵ مگابایت — بعد از انتخاب فایل، ذخیره جداگانه لازم نیست.</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
