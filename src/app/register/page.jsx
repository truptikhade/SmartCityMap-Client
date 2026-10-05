'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Mail, Lock, User, Phone, Loader2, MapPin, Navigation, Eye, EyeOff } from 'lucide-react'

import { registerAPI, registerDriverAPI } from '../../api/auth.api'

// --------------------------------------------------
// Theme — keep these in sync with the login page
// --------------------------------------------------

// Use the SAME image file your login page uses on its left side
const ILLUSTRATION = '/loginBackGround.png'

const labelClass = 'mb-1.5 block text-sm font-medium text-mauve-900'

const inputBase =
  'h-11 w-full rounded-xl border border-mauve-200 bg-white text-sm text-mauve-950 outline-none transition placeholder:text-mauve-400 focus:border-mauve-500 focus:ring-2 focus:ring-mauve-500/20 disabled:opacity-60'
const inputClass = `${inputBase} px-3`
const inputWithIcon = `${inputBase} pl-9 pr-3`
const inputUpper = `${inputClass} uppercase placeholder:normal-case`

const iconClass = 'absolute left-3 top-1/2 -translate-y-1/2 text-mauve-400'

const primaryBtn =
  'h-11 rounded-xl bg-mauve-800 text-sm font-semibold text-white transition hover:bg-mauve-900 disabled:cursor-not-allowed disabled:opacity-60'

const steps = [
  { id: 1, label: 'Personal' },
  { id: 2, label: 'License' },
  { id: 3, label: 'Vehicle' },
]

// --------------------------------------------------
// Small pieces
// --------------------------------------------------

function InfoNote({ children }) {
  return (
    <div className="mt-5 rounded-xl border border-mauve-200 bg-mauve-50 px-3.5 py-3">
      <div className="flex items-start gap-2.5">
        <Navigation size={16} className="mt-0.5 shrink-0 text-mauve-600" />
        <p className="text-xs leading-5 text-mauve-700">{children}</p>
      </div>
    </div>
  )
}

function Field({ label, icon: Icon, className = '', children }) {
  return (
    <div className={className}>
      <label className={labelClass}>{label}</label>
      {Icon ? (
        <div className="relative">
          <Icon size={17} className={iconClass} />
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  )
}

function ButtonLabel({ loading, loadingText, text }) {
  return (
    <span className="flex items-center justify-center gap-2">
      {loading && <Loader2 size={17} className="animate-spin" />}
      {loading ? loadingText : text}
    </span>
  )
}

function Stepper({ currentStep }) {
  return (
    <div className="relative mb-6 flex items-start justify-between">
      <div
        className={`absolute left-[16.667%] top-4 h-[2px] w-[33.333%] -translate-y-1/2 transition-colors ${
          currentStep > 1 ? 'bg-mauve-600' : 'bg-mauve-200'
        }`}
      />
      <div
        className={`absolute left-1/2 top-4 h-[2px] w-[33.333%] -translate-y-1/2 transition-colors ${
          currentStep > 2 ? 'bg-mauve-600' : 'bg-mauve-200'
        }`}
      />

      {steps.map((step) => {
        const active = currentStep >= step.id
        return (
          <div key={step.id} className="relative z-10 flex w-1/3 flex-col items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                active
                  ? 'bg-mauve-700 text-white ring-4 ring-mauve-100'
                  : 'bg-mauve-100 text-mauve-400'
              }`}
            >
              {step.id}
            </div>
            <span
              className={`mt-2 text-xs font-medium ${
                active ? 'text-mauve-800' : 'text-mauve-400'
              }`}
            >
              {step.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// --------------------------------------------------
// Form
// --------------------------------------------------

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [role, setRole] = useState(searchParams.get('role') === 'driver' ? 'driver' : 'user')
  const [currentStep, setCurrentStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    fname: '',
    lname: '',
    email: '',
    phone: '',
    password: '',
    licenseNumber: '',
    vehicleNumber: '',
    vehicleType: 'car',
    brand: '',
    model: '',
    color: '',
  })

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleRoleChange = (nextRole) => {
    setRole(nextRole)
    setCurrentStep(1)
  }

  // ---------------- Validation ----------------

  const validateCommonFields = () => {
    if (
      !form.fname.trim() ||
      !form.lname.trim() ||
      !form.email.trim() ||
      !form.phone.trim() ||
      !form.password
    ) {
      toast.error('Please fill in all personal details')
      return false
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return false
    }
    return true
  }

  const validateDriverFields = () => {
    if (!form.licenseNumber.trim()) {
      toast.error('Please enter your license number')
      return false
    }
    return true
  }

  const validateVehicleFields = () => {
    if (
      !form.vehicleNumber.trim() ||
      !form.vehicleType ||
      !form.brand.trim() ||
      !form.model.trim() ||
      !form.color.trim()
    ) {
      toast.error('Please fill in all vehicle details')
      return false
    }
    return true
  }

  // ---------------- Navigation ----------------

  const handleNextStep = () => {
    if (currentStep === 1 && validateCommonFields()) setCurrentStep(2)
    else if (currentStep === 2 && validateDriverFields()) setCurrentStep(3)
  }

  const handlePrevStep = () => setCurrentStep((previous) => Math.max(previous - 1, 1))

  // ---------------- Submit ----------------

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (role === 'driver' && currentStep < 3) {
      handleNextStep()
      return
    }

    if (!validateCommonFields()) return
    if (role === 'driver' && (!validateDriverFields() || !validateVehicleFields())) return

    setLoading(true)

    try {
      const personal = {
        fname: form.fname.trim(),
        lname: form.lname.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
      }

      if (role === 'user') {
        await registerAPI(personal)
        toast.success('Account created successfully! Please login.')
      } else {
        await registerDriverAPI({
          ...personal,
          licenseNumber: form.licenseNumber.trim(),
          vehicleNumber: form.vehicleNumber.trim(),
          vehicleType: form.vehicleType,
          brand: form.brand.trim() || undefined,
          model: form.model.trim() || undefined,
          color: form.color.trim() || undefined,
        })
        toast.success('Driver account created successfully! Please login.')
      }

      router.replace('/login')
    } catch (error) {
      console.error('Registration error:', error)
      toast.error(error?.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  // ---------------- UI ----------------

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-stone-100 px-4 py-8">
      <div className="flex w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl">
        {/* Left — illustration (same as login) */}
        <div className="relative hidden w-[45%] md:block">
          <img
            src="/loginBackGround.jpg"
            alt="Registration Visuals"
            className="h-full w-full object-cover"
          />
        </div>

        {/* Right — form */}
        <div className="flex flex-1 flex-col justify-center px-6 py-10 sm:px-12">
          <div className="mx-auto w-full max-w-[400px]">
            {/* Brand header */}
            <div className="mb-6 text-center">
              {/* <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-mauve-600 text-white">
                <MapPin size={26} />
              </div> */}
              <h1 className="text-2xl font-bold tracking-tight text-mauve-950"> {role === 'driver' ? 'Registration' : 'Registration'}</h1>
            </div>

            {/* Role toggle */}
            <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-mauve-100 p-1">
              {[
                { value: 'user', label: 'Passenger' },
                { value: 'driver', label: 'Driver' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleRoleChange(option.value)}
                  className={`rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                    role === option.value
                      ? 'bg-white text-mauve-800 shadow-sm'
                      : 'text-mauve-500 hover:text-mauve-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {role === 'driver' && <Stepper currentStep={currentStep} />}

            <form onSubmit={handleSubmit}>
              {/* STEP 1 — Personal */}
              {currentStep === 1 && (
                <div className="animate-in fade-in duration-200">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="First Name" icon={User}>
                      <input
                        type="text"
                        name="fname"
                        value={form.fname}
                        onChange={handleChange}
                        placeholder="Rahul"
                        autoComplete="given-name"
                        disabled={loading}
                        className={inputWithIcon}
                      />
                    </Field>

                    <Field label="Last Name">
                      <input
                        type="text"
                        name="lname"
                        value={form.lname}
                        onChange={handleChange}
                        placeholder="Patil"
                        autoComplete="family-name"
                        disabled={loading}
                        className={inputClass}
                      />
                    </Field>
                  </div>

                  <Field label="Email" icon={Mail} className="mt-4">
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      autoComplete="email"
                      disabled={loading}
                      className={inputWithIcon}
                    />
                  </Field>

                  <Field label="Phone" icon={Phone} className="mt-4">
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="9876543210"
                      autoComplete="tel"
                      disabled={loading}
                      className={inputWithIcon}
                    />
                  </Field>

                  <Field label="Password" icon={Lock} className="mt-4">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      disabled={loading}
                      className={`${inputBase} pl-9 pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((previous) => !previous)}
                      disabled={loading}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-mauve-400 transition hover:text-mauve-600 disabled:opacity-50"
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </Field>
                </div>
              )}

              {/* STEP 2 — License */}
              {role === 'driver' && currentStep === 2 && (
                <div className="animate-in fade-in duration-200">
                  <Field label="License Number">
                    <input
                      type="text"
                      name="licenseNumber"
                      value={form.licenseNumber}
                      onChange={handleChange}
                      placeholder="MH1220261234567"
                      disabled={loading}
                      className={inputUpper}
                    />
                  </Field>
                  <InfoNote>Make sure your license number is entered correctly.</InfoNote>
                </div>
              )}

              {/* STEP 3 — Vehicle */}
              {role === 'driver' && currentStep === 3 && (
                <div className="animate-in fade-in duration-200">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Vehicle Number">
                      <input
                        type="text"
                        name="vehicleNumber"
                        value={form.vehicleNumber}
                        onChange={handleChange}
                        placeholder="MH12AB1234"
                        disabled={loading}
                        className={inputUpper}
                      />
                    </Field>

                    <Field label="Vehicle Type">
                      <select
                        name="vehicleType"
                        value={form.vehicleType}
                        onChange={handleChange}
                        disabled={loading}
                        className={inputClass}
                      >
                        <option value="car">Car</option>
                        <option value="twoWheeler">Two Wheeler</option>
                        <option value="auto">Auto</option>
                      </select>
                    </Field>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <Field label="Brand">
                      <input
                        type="text"
                        name="brand"
                        value={form.brand}
                        onChange={handleChange}
                        placeholder="Maruti"
                        disabled={loading}
                        className={inputClass}
                      />
                    </Field>

                    <Field label="Model">
                      <input
                        type="text"
                        name="model"
                        value={form.model}
                        onChange={handleChange}
                        placeholder="Swift"
                        disabled={loading}
                        className={inputClass}
                      />
                    </Field>
                  </div>

                  <Field label="Color" className="mt-4">
                    <input
                      type="text"
                      name="color"
                      value={form.color}
                      onChange={handleChange}
                      placeholder="White"
                      disabled={loading}
                      className={inputClass}
                    />
                  </Field>

                  <InfoNote>
                    Driver accounts require admin approval before you can receive ride requests.
                  </InfoNote>
                </div>
              )}

              {/* Buttons */}
              <div className="mt-6 flex items-center gap-3">
                {role === 'driver' && currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    disabled={loading}
                    className="h-11 w-1/2 rounded-xl border border-mauve-200 bg-white text-sm font-semibold text-mauve-800 transition hover:bg-mauve-50 disabled:opacity-50"
                  >
                    Back
                  </button>
                )}

                {role === 'driver' && currentStep < 3 && (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={loading}
                    className={`${primaryBtn} flex-1`}
                  >
                    Next
                  </button>
                )}

                {role === 'user' && (
                  <button type="submit" disabled={loading} className={`${primaryBtn} w-full`}>
                    <ButtonLabel loading={loading} loadingText="Creating account..." text="Sign Up" />
                  </button>
                )}

                {role === 'driver' && currentStep === 3 && (
                  <button type="submit" disabled={loading} className={`${primaryBtn} flex-1`}>
                    <ButtonLabel
                      loading={loading}
                      loadingText="Registering driver..."
                      text="Register as Driver"
                    />
                  </button>
                )}
              </div>
            </form>

            {/* Footer */}
            <p className="mt-6 text-center text-sm text-mauve-600">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-mauve-950 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Register() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  )
}