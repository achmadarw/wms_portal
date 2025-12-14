$file = 'D:\WORKSPACE\PROJECT\WMS\wms_portal\src\app\dashboard\users\page.tsx'
$content = Get-Content $file -Raw

# Replace X icons (2 instances)
$xPattern = [regex]::Escape('                                <svg
                                    className=''w-6 h-6''
                                    fill=''none''
                                    stroke=''currentColor''
                                    viewBox=''0 0 24 24''
                                >
                                    <path
                                        strokeLinecap=''round''
                                        strokeLinejoin=''round''
                                        strokeWidth={2.5}
                                        d=''M6 18L18 6M6 6l12 12''       
                                    />
                                </svg>')
$content = $content.Replace($xPattern, '                                <XIcon className=''w-6 h-6'' />')

# Replace check icon
$checkPattern = [regex]::Escape('                                                <svg
                                                    className=''w-5 h-5''
                                                    fill=''none''        
                                                    stroke=''currentColor''
                                                    viewBox=''0 0 24 24''
                                                >
                                                    <path
                                                        strokeLinecap=''round''
                                                        strokeLinejoin=''round''
                                                        strokeWidth={2}
                                                        d=''M5 13l4 4L19 7''
                                                    />
                                                </svg>')
$content = $content.Replace($checkPattern, '                                                <CheckIcon className=''w-5 h-5'' />')

Set-Content $file -Value $content -NoNewline
Write-Host "Replaced all remaining SVGs"
